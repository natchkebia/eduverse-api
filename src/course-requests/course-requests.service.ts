import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CourseRequestStatus,
  CourseStatus,
  CourseType,
  CourseDelivery,
  CourseFormat,
} from "@prisma/client";
import { addDays } from "date-fns";
import { CreateCourseRequestDto } from "./dto/create-course-request.dto";
import { computePricing } from "../common/pricing/pricing";

@Injectable()
export class CourseRequestsService {
  constructor(private prisma: PrismaService) {}

  private makeSlug(title: string) {
    const cleaned = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}\-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const base = cleaned.length ? cleaned : "course";
    return `${base}-${Date.now()}`;
  }

  // STEP 1 — USER creates DRAFT
  async createDraft(userId: string, dto: CreateCourseRequestDto) {
    const delivery =
      dto.type === CourseType.COURSE
        ? dto.delivery ?? CourseDelivery.LIVE
        : CourseDelivery.LIVE;

    // ✅ pricing
    let pricing = {
      originalPrice: 0,
      discountedPrice: null as number | null,
      discountPercent: null as number | null,
    };

    if (dto.originalPrice !== undefined && dto.originalPrice !== null) {
      try {
        pricing = computePricing(dto.originalPrice, dto.discountedPrice ?? null);
      } catch (e: any) {
        throw new BadRequestException(e.message);
      }
    }

    const requestVideosCreate =
      dto.type === CourseType.COURSE &&
      delivery === CourseDelivery.VIDEO &&
      dto.videoUrls?.length
        ? {
            create: dto.videoUrls.map((url, idx) => ({
              url,
              order: idx + 1,
            })),
          }
        : undefined;

    return this.prisma.courseRequest.create({
      data: {
        creator: { connect: { id: userId } },

        type: dto.type,
        category: dto.category,
        format: dto.format,
        delivery,

        titleKa: dto.titleKa,
        titleEn: dto.titleEn ?? null,
        descriptionKa: dto.descriptionKa,
        descriptionEn: dto.descriptionEn ?? null,
        imageUrl: dto.imageUrl ?? null,

        languageKa: dto.languageKa ?? null,
        languageEn: dto.languageEn ?? null,

        syllabusKa:
          dto.type === CourseType.COURSE ? dto.syllabusKa ?? null : null,
        syllabusEn:
          dto.type === CourseType.COURSE ? dto.syllabusEn ?? null : null,
        mentorKa:
          dto.type === CourseType.COURSE ? dto.mentorKa ?? null : null,
        mentorEn:
          dto.type === CourseType.COURSE ? dto.mentorEn ?? null : null,

        // ✅ pricing fields (NO discount string)
        originalPrice: dto.originalPrice ?? null,
        discountedPrice:
          dto.originalPrice != null ? pricing.discountedPrice : null,
        discountPercent:
          dto.originalPrice != null ? pricing.discountPercent : null,

        // WORKSHOP / MASTERCLASS
        date:
          dto.type !== CourseType.COURSE && dto.date
            ? new Date(dto.date)
            : null,
        location:
          dto.format === CourseFormat.ONSITE ? dto.location ?? null : null,

        // LIVE COURSE
        startDate:
          dto.type === CourseType.COURSE &&
          delivery === CourseDelivery.LIVE &&
          dto.startDate
            ? new Date(dto.startDate)
            : null,

        // VIDEO COURSE
        requestVideos: requestVideosCreate,

        status: CourseRequestStatus.DRAFT,
      },
      include: { requestVideos: true, creator: true },
    });
  }

  // STEP 2 — USER sets listing details
  async setDetails(
    requestId: string,
    userId: string,
    listingDays: number,
    listingFee: number
  ) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException("Course request not found");
    if (request.creatorId !== userId) throw new ForbiddenException();

    if (!Number.isInteger(listingDays) || listingDays < 1) {
      throw new BadRequestException("listingDays must be >= 1");
    }
    if (!Number.isInteger(listingFee) || listingFee < 0) {
      throw new BadRequestException("listingFee must be >= 0");
    }

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: {
        listingDays,
        listingFee,
        status: CourseRequestStatus.PENDING_PAYMENT,
      },
    });
  }

  async markAsPaid(requestId: string, userId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException("Course request not found");
    if (request.creatorId !== userId) throw new ForbiddenException();

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.PAID },
    });
  }

  async submitForApproval(requestId: string, userId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
      include: { requestVideos: true },
    });
    if (!request) throw new NotFoundException("Course request not found");
    if (request.creatorId !== userId) throw new ForbiddenException();

    if (!request.category || !request.format) {
      throw new ForbiddenException("Category and format are required");
    }
    if (!request.languageKa) {
      throw new ForbiddenException("Language is required");
    }

    if (request.type === CourseType.COURSE) {
      if (!request.syllabusKa) {
        throw new ForbiddenException("Syllabus is required for course");
      }

      if (!request.delivery) {
        throw new ForbiddenException("Delivery is required for course");
      }

      if (
        request.delivery === CourseDelivery.LIVE &&
        !request.startDate
      ) {
        throw new ForbiddenException("Start date is required for live course");
      }

      if (request.delivery === CourseDelivery.VIDEO) {
        if (!request.requestVideos?.length) {
          throw new ForbiddenException(
            "At least 1 video is required for video course"
          );
        }
        if (request.requestVideos.length > 25) {
          throw new ForbiddenException("Max 25 videos allowed");
        }
      }

      if (
        !request.listingDays ||
        request.listingFee === null ||
        request.listingFee === undefined
      ) {
        throw new ForbiddenException(
          "Fill details first (listingDays & listingFee required)"
        );
      }
    }

    if (request.type !== CourseType.COURSE) {
      if (!request.date) {
        throw new ForbiddenException(
          "Date is required for workshop/masterclass"
        );
      }
    }

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.PENDING_APPROVAL },
    });
  }

  async getPendingRequests() {
    return this.prisma.courseRequest.findMany({
      where: { status: CourseRequestStatus.PENDING_APPROVAL },
      include: { creator: true, requestVideos: true, requestMaterials: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // ADMIN — approve: create Course from request
  async approve(requestId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
      include: { requestVideos: true, requestMaterials: true },
    });
    if (!request) throw new NotFoundException("Course request not found");

    if (request.status !== CourseRequestStatus.PENDING_APPROVAL) {
      throw new ForbiddenException("Request must be PENDING_APPROVAL");
    }

    const listingEndsAt =
      request.listingDays && request.listingDays > 0
        ? addDays(new Date(), request.listingDays)
        : null;

    let pricingFinal = {
      originalPrice: 0,
      discountedPrice: null as number | null,
      discountPercent: null as number | null,
    };

    if (request.originalPrice !== null && request.originalPrice !== undefined) {
      pricingFinal = computePricing(
        request.originalPrice,
        request.discountedPrice ?? null
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const slug = this.makeSlug(request.titleEn ?? request.titleKa);

      const createdCourse = await tx.course.create({
        data: {
          slug,
          type: request.type,

          creatorId: request.creatorId,

          category: request.category!,
          format: request.format!,
          delivery: request.delivery ?? CourseDelivery.LIVE,

          titleKa: request.titleKa,
          titleEn: request.titleEn ?? null,
          descriptionKa: request.descriptionKa,
          descriptionEn: request.descriptionEn ?? null,

          imageUrl: request.imageUrl ?? "",
          altTextKa: request.titleKa,
          altTextEn: request.titleEn ?? request.titleKa,

          buttonKa: "დარეგისტრირება",
          buttonEn: "Register",

          formatKa:
            request.format === CourseFormat.ONSITE ? "ადგილზე" : "ონლაინ",
          formatEn:
            request.format === CourseFormat.ONSITE ? "On-site" : "Online",
          languageKa: request.languageKa ?? "ქართული",
          languageEn: request.languageEn ?? null,

          location: request.location,

          startDate: request.startDate,
          endDate: request.endDate,
          date: request.date,

          listingEndsAt,
          status: CourseStatus.ACTIVE,

          syllabusKa: request.syllabusKa,
          syllabusEn: request.syllabusEn,
          mentorKa: request.mentorKa,
          mentorEn: request.mentorEn,

          // ✅ pricing (NO discount string)
          originalPrice: request.originalPrice ?? 0,
          discountedPrice: pricingFinal.discountedPrice,
          discountPercent: pricingFinal.discountPercent,

          videos:
            request.delivery === CourseDelivery.VIDEO &&
            request.requestVideos?.length
              ? {
                  create: request.requestVideos.map((v) => ({ url: v.url })),
                }
              : undefined,

          materials:
            request.requestMaterials?.length
              ? {
                  create: request.requestMaterials.map((m) => ({
                    link: m.link,
                  })),
                }
              : undefined,
        },
        include: { videos: true, materials: true },
      });

      await tx.courseRequest.update({
        where: { id: requestId },
        data: { status: CourseRequestStatus.APPROVED },
      });

      return createdCourse;
    });
  }

  async reject(requestId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException("Course request not found");

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.REJECTED },
    });
  }
}
