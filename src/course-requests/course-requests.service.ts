import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CourseRequestStatus,
  CourseStatus,
  CourseType,
  CourseDelivery,
  CourseFormat,
} from '@prisma/client';
import { addDays } from 'date-fns';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';

@Injectable()
export class CourseRequestsService {
  constructor(private prisma: PrismaService) {}

  // პატარა helper slug-ისთვის
  private makeSlug(title: string) {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    return `${base}-${Date.now()}`;
  }

  // STEP 1 — USER creates DRAFT (real fields)
  async createDraft(userId: string, dto: CreateCourseRequestDto) {
    // WORKSHOP/MASTERCLASS ყოველთვის LIVE
    const delivery =
      dto.type === CourseType.COURSE
        ? (dto.delivery ?? CourseDelivery.LIVE)
        : CourseDelivery.LIVE;

    // ფასდაკლება -> discountedPrice
    const originalPrice = dto.price;
    const discountPercent = dto.type === CourseType.COURSE ? dto.discountPercent : undefined;
    const discountedPrice =
      discountPercent && discountPercent > 0
        ? Math.max(0, Math.round(originalPrice - (originalPrice * discountPercent) / 100))
        : originalPrice;

    // VIDEO კურსის videoUrls -> requestVideos create
    const requestVideosCreate =
      dto.type === CourseType.COURSE && delivery === CourseDelivery.VIDEO && dto.videoUrls?.length
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
        format: dto.format as unknown as CourseFormat, // თუ dto-ში enum-ია, ეს cast არ დაგჭირდება
        delivery,

        titleKa: dto.titleKa,
        titleEn: dto.titleEn,
        descriptionKa: dto.descriptionKa,
        descriptionEn: dto.descriptionEn,
        imageUrl: dto.imageUrl,

        languageKa: dto.languageKa,
        languageEn: dto.languageEn,

        // COURSE-only fields
        syllabusKa: dto.type === CourseType.COURSE ? dto.syllabusKa : null,
        syllabusEn: dto.type === CourseType.COURSE ? dto.syllabusEn : null,
        mentorKa: dto.type === CourseType.COURSE ? dto.mentorKa : null,
        mentorEn: dto.type === CourseType.COURSE ? dto.mentorEn : null,

        // price
        price: dto.price, // legacy
        originalPrice,
        discountedPrice,
        discount: discountPercent ? `${discountPercent}%` : null,

        // WORKSHOP/MASTERCLASS
        date: dto.type !== CourseType.COURSE && dto.date ? new Date(dto.date) : null,
        location: dto.format === CourseFormat.ONSITE ? dto.location : null,

        // LIVE COURSE
        startDate:
          dto.type === CourseType.COURSE && delivery === CourseDelivery.LIVE && dto.startDate
            ? new Date(dto.startDate)
            : null,

        // VIDEO COURSE
        requestVideos: requestVideosCreate,

        status: CourseRequestStatus.DRAFT,
      },
      include: { requestVideos: true, creator: true },
    });
  }

  // STEP 2 — USER sets days + price (listing)
  async setDetails(requestId: string, userId: string, days: number, price: number) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Course request not found');
    if (request.creatorId !== userId) throw new ForbiddenException();

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: {
        days,   // listing days
        price,  // listing fee (შენ ახლა ასე გაქვს)
        status: CourseRequestStatus.PENDING_PAYMENT,
      },
    });
  }

  async markAsPaid(requestId: string, userId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Course request not found');
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
    if (!request) throw new NotFoundException('Course request not found');
    if (request.creatorId !== userId) throw new ForbiddenException();

    // ✅ base required
    if (!request.category || !request.format) {
      throw new ForbiddenException('Category and format are required');
    }
    if (!request.languageKa) {
      throw new ForbiddenException('Language is required');
    }

    // ✅ COURSE validations
    if (request.type === CourseType.COURSE) {
      if (!request.syllabusKa) throw new ForbiddenException('Syllabus is required for course');

      // delivery must exist for COURSE
      if (!request.delivery) throw new ForbiddenException('Delivery is required for course');

      if (request.delivery === CourseDelivery.LIVE) {
        if (!request.startDate) throw new ForbiddenException('Start date is required for live course');
      }

      if (request.delivery === CourseDelivery.VIDEO) {
        if (!request.requestVideos?.length) {
          throw new ForbiddenException('At least 1 video is required for video course');
        }
        if (request.requestVideos.length > 25) {
          throw new ForbiddenException('Max 25 videos allowed');
        }
      }

      // listing details (შენ ახლა COURSE-ზე ითხოვდი)
      if (!request.days || request.price === null || request.price === undefined) {
        throw new ForbiddenException('Fill details first (days & price required)');
      }
    }

    // ✅ WORKSHOP / MASTERCLASS validations
    if (request.type !== CourseType.COURSE) {
      if (!request.date) throw new ForbiddenException('Date is required for workshop/masterclass');

      // სურვილისამებრ: listing days/fee თუ გინდა workshop-ზეც
      // თუ არა — კომენტარად დატოვე
      // if (!request.days || request.price === null || request.price === undefined) {
      //   throw new ForbiddenException('Fill details first (days & price required)');
      // }
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
      orderBy: { createdAt: 'desc' },
    });
  }

  // ADMIN — approve: create Course from request (no defaults)
  async approve(requestId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
      include: { requestVideos: true, requestMaterials: true },
    });
    if (!request) throw new NotFoundException('Course request not found');

    // safety
    if (request.status !== CourseRequestStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('Request must be PENDING_APPROVAL');
    }

    // listing endDate (used by your cron)
    const listingEndDate =
      request.days && request.days > 0 ? addDays(new Date(), request.days) : null;

    const result = await this.prisma.$transaction(async (tx) => {
      const slug = this.makeSlug(request.titleEn ?? request.titleKa);

      const createdCourse = await tx.course.create({
        data: {
          slug,
          type: request.type,

          creatorId: request.creatorId,

          category: request.category ?? undefined,
          format: request.format ?? undefined,
          delivery: request.delivery ?? CourseDelivery.LIVE,

          titleKa: request.titleKa,
          titleEn: request.titleEn ?? request.titleKa,
          descriptionKa: request.descriptionKa,
          descriptionEn: request.descriptionEn ?? request.descriptionKa,

          imageUrl: request.imageUrl ?? '',
          altTextKa: request.titleKa,
          altTextEn: request.titleEn ?? request.titleKa,

          // UI text - თუ გინდა request-იდანაც წამოვიდეს, მერე დავამატებთ
          buttonKa: 'დარეგისტრირება',
          buttonEn: 'Register',

          // აქ უკვე request-იდან ვიღებთ რეალურს
          formatKa: request.format === CourseFormat.ONSITE ? 'ადგილზე' : 'ონლაინ',
          formatEn: request.format === CourseFormat.ONSITE ? 'On-site' : 'Online',
          languageKa: request.languageKa ?? 'ქართული',
          languageEn: request.languageEn ?? 'Georgian',

          location: request.location,

          // ✅ live vs workshop dates
          startDate: request.startDate,
          endDate: listingEndDate, // ⚠️ ეს listing expiry-ა (cron ამას იყენებს)
          date: request.date,

          status: CourseStatus.ACTIVE,

          syllabusKa: request.syllabusKa,
          syllabusEn: request.syllabusEn,
          mentorKa: request.mentorKa,
          mentorEn: request.mentorEn,

          // price
          originalPrice: request.originalPrice ?? request.price ?? 0,
          discountedPrice: request.discountedPrice ?? request.price ?? 0,
          discount: request.discount,

          // copy videos/materials from request
          videos:
            request.delivery === CourseDelivery.VIDEO && request.requestVideos?.length
              ? { create: request.requestVideos.map((v) => ({ url: v.url })) }
              : undefined,

          materials:
            request.requestMaterials?.length
              ? { create: request.requestMaterials.map((m) => ({ link: m.link })) }
              : undefined,
        },
        include: { videos: true, materials: true },
      });

      const updatedRequest = await tx.courseRequest.update({
        where: { id: requestId },
        data: { status: CourseRequestStatus.APPROVED },
      });

      return { createdCourse, updatedRequest };
    });

    return result;
  }

  async reject(requestId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Course request not found');

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.REJECTED },
    });
  }
}
