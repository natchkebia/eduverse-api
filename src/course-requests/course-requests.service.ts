import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CourseRequestStatus,
  CourseStatus,
  CourseType,
  CourseDelivery,
  CourseFormat,
  Role,
  TeachingLanguage,
} from '@prisma/client';
import { addDays } from 'date-fns';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';
import { computePricing } from '../common/pricing/pricing';

const LISTING_PRICE_PER_DAY = 5;
const MAX_LISTING_DAYS = 30;

@Injectable()
export class CourseRequestsService {
  constructor(private prisma: PrismaService) {}

  private trimOrNull(v?: string | null): string | null {
    if (v === undefined || v === null) return null;
    const t = String(v).trim();
    return t.length ? t : null;
  }

  private makeSlug(title: string) {
    const cleaned = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const base = cleaned.length ? cleaned : 'course';
    return `${base}-${Date.now()}`;
  }

  private isAdminRole(role?: Role) {
    return String(role).toUpperCase() === Role.ADMIN;
  }

  private async getOwnedRequestOrThrow(
    requestId: string,
    userId: string,
    include?: any,
  ) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
      ...(include ? { include } : {}),
    });

    if (!request) throw new NotFoundException('Course request not found');
    if (request.creatorId !== userId) throw new ForbiddenException();
    return request;
  }

  private require(condition: any, message: string) {
    if (!condition) throw new BadRequestException(message);
  }

  private validateEnglishGroupOnDto(dto: Partial<CreateCourseRequestDto>) {
    const titleEn = this.trimOrNull(dto.titleEn);
    const descEn = this.trimOrNull(dto.descriptionEn);
    const syllEn = this.trimOrNull(dto.syllabusEn);

    const mfEn = this.trimOrNull(dto.mentorFirstNameEn);
    const mlEn = this.trimOrNull(dto.mentorLastNameEn);
    const mbEn = this.trimOrNull(dto.mentorBioEn);

    const anyContentEn = !!(titleEn || descEn || syllEn);
    const anyMentorNameEn = !!(mfEn || mlEn);
    const anyMentorEn = anyMentorNameEn || !!mbEn;

    if (anyContentEn) {
      this.require(!!titleEn, 'titleEn required when providing English fields');
      this.require(
        !!descEn,
        'descriptionEn required when providing English fields',
      );
    }

    if (anyMentorEn) {
      this.require(
        !!mfEn && !!mlEn,
        'mentorFirstNameEn and mentorLastNameEn are required together (if English mentor fields provided)',
      );
    }
  }

  private validateEnglishGroupOnRecord(r: any) {
    const titleEn = this.trimOrNull(r.titleEn);
    const descEn = this.trimOrNull(r.descriptionEn);
    const syllEn = this.trimOrNull(r.syllabusEn);

    const mfEn = this.trimOrNull(r.mentorFirstNameEn);
    const mlEn = this.trimOrNull(r.mentorLastNameEn);
    const mbEn = this.trimOrNull(r.mentorBioEn);

    const anyContentEn = !!(titleEn || descEn || syllEn);
    const anyMentorEn = !!(mfEn || mlEn || mbEn);

    if (anyContentEn) {
      this.require(!!titleEn, 'titleEn required when English content is provided');
      this.require(!!descEn, 'descriptionEn required when English content is provided');
    }

    if (anyMentorEn) {
      this.require(
        !!mfEn && !!mlEn,
        'mentorFirstNameEn and mentorLastNameEn are required together (if English mentor fields provided)',
      );
    }
  }

  // -----------------------------
  // CREATE DRAFT (შენი კოდი უცვლელად)
  // -----------------------------
  async createDraft(userId: string, dto: CreateCourseRequestDto) {
    this.validateEnglishGroupOnDto(dto);

    const delivery =
      dto.type === CourseType.COURSE
        ? dto.delivery ?? CourseDelivery.LIVE
        : CourseDelivery.LIVE;

    let pricing = {
      originalPrice: 0,
      discountedPrice: null as number | null,
      discountPercent: null as number | null,
    };

    if (dto.originalPrice !== undefined && dto.originalPrice !== null) {
      pricing = computePricing(dto.originalPrice, dto.discountedPrice ?? null);
    }

    const requestVideosCreate =
      dto.type === CourseType.COURSE &&
      delivery === CourseDelivery.VIDEO &&
      dto.videoUrls?.length
        ? {
            create: dto.videoUrls.map((url, idx) => ({ url, order: idx + 1 })),
          }
        : undefined;

    const format =
      delivery === CourseDelivery.LIVE ? (dto.format ?? null) : null;

    const address =
      delivery === CourseDelivery.LIVE && format === CourseFormat.ONSITE
        ? this.trimOrNull(dto.address)
        : null;

    const onlineUrl =
      delivery === CourseDelivery.LIVE && format === CourseFormat.ONLINE
        ? this.trimOrNull(dto.onlineUrl)
        : null;

    const titleKa = this.trimOrNull(dto.titleKa) ?? '';
    const descriptionKa = this.trimOrNull(dto.descriptionKa) ?? '';

    const syllabusKa =
      dto.type === CourseType.COURSE ? this.trimOrNull(dto.syllabusKa) : null;

    const mentorFirstNameKa =
      dto.type === CourseType.COURSE
        ? this.trimOrNull(dto.mentorFirstNameKa)
        : null;

    const mentorLastNameKa =
      dto.type === CourseType.COURSE
        ? this.trimOrNull(dto.mentorLastNameKa)
        : null;

    const mentorBioKa =
      dto.type === CourseType.COURSE ? this.trimOrNull(dto.mentorBioKa) : null;

    const titleEn = this.trimOrNull(dto.titleEn);
    const descriptionEn = this.trimOrNull(dto.descriptionEn);
    const syllabusEn = this.trimOrNull(dto.syllabusEn);

    const mentorFirstNameEn = this.trimOrNull(dto.mentorFirstNameEn);
    const mentorLastNameEn = this.trimOrNull(dto.mentorLastNameEn);
    const mentorBioEn = this.trimOrNull(dto.mentorBioEn);

    const teachingLanguage = dto.teachingLanguage ?? TeachingLanguage.KA;

    return this.prisma.courseRequest.create({
      data: {
        creator: { connect: { id: userId } },

        type: dto.type,
        category: dto.category ?? null,
        format: format as any,
        delivery: delivery as any,

        teachingLanguage,

        titleKa,
        descriptionKa,
        syllabusKa,
        mentorFirstNameKa,
        mentorLastNameKa,
        mentorBioKa,

        titleEn,
        descriptionEn,
        syllabusEn,
        mentorFirstNameEn,
        mentorLastNameEn,
        mentorBioEn,

        enAutoTranslated: false,
        imageUrl: this.trimOrNull(dto.imageUrl),

        originalPrice: dto.originalPrice ?? null,
        discountedPrice:
          dto.originalPrice != null ? pricing.discountedPrice : null,
        discountPercent:
          dto.originalPrice != null ? pricing.discountPercent : null,

        date:
          dto.type !== CourseType.COURSE && dto.date ? new Date(dto.date) : null,
        address,
        onlineUrl,
        startDate:
          dto.type === CourseType.COURSE &&
          delivery === CourseDelivery.LIVE &&
          dto.startDate
            ? new Date(dto.startDate)
            : null,
        endDate:
          dto.type === CourseType.COURSE &&
          delivery === CourseDelivery.LIVE &&
          dto.endDate
            ? new Date(dto.endDate)
            : null,

        requestVideos: requestVideosCreate,

        status: CourseRequestStatus.DRAFT,
      },
      include: { requestVideos: true, creator: true },
    });
  }

  // -----------------------------
  // UPDATE DRAFT (შენი კოდი უცვლელად)
  // -----------------------------
  async updateDraft(
    requestId: string,
    userId: string,
    dto: Partial<CreateCourseRequestDto>,
  ) {
    const request = await this.getOwnedRequestOrThrow(requestId, userId);

    this.validateEnglishGroupOnDto(dto);

    let pricing = {
      originalPrice: request.originalPrice ?? 0,
      discountedPrice: request.discountedPrice ?? null,
      discountPercent: request.discountPercent ?? null,
    };

    if (dto.originalPrice !== undefined) {
      pricing = computePricing(
        dto.originalPrice ?? 0,
        dto.discountedPrice ?? null,
      );
    }

    const nextDelivery =
      request.type === CourseType.COURSE
        ? dto.delivery ?? request.delivery ?? CourseDelivery.LIVE
        : CourseDelivery.LIVE;

    const nextFormat =
      nextDelivery === CourseDelivery.LIVE
        ? ((dto.format ?? request.format) as CourseFormat | null)
        : null;

    const address =
      nextDelivery === CourseDelivery.LIVE && nextFormat === CourseFormat.ONSITE
        ? this.trimOrNull(dto.address) ?? request.address ?? null
        : null;

    const onlineUrl =
      nextDelivery === CourseDelivery.LIVE && nextFormat === CourseFormat.ONLINE
        ? this.trimOrNull(dto.onlineUrl) ?? request.onlineUrl ?? null
        : null;

    const startDate =
      nextDelivery === CourseDelivery.LIVE
        ? (dto.startDate ? new Date(dto.startDate) : undefined)
        : null;

    const endDate =
      nextDelivery === CourseDelivery.LIVE
        ? (dto.endDate ? new Date(dto.endDate) : undefined)
        : null;

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: {
        category: dto.category ?? undefined,
        delivery: (nextDelivery as any) ?? undefined,

        format:
          nextDelivery === CourseDelivery.VIDEO
            ? null
            : dto.format ?? undefined,

        teachingLanguage: dto.teachingLanguage ?? undefined,

        titleKa: dto.titleKa ?? undefined,
        descriptionKa: dto.descriptionKa ?? undefined,
        syllabusKa: dto.syllabusKa ?? undefined,
        mentorFirstNameKa: dto.mentorFirstNameKa ?? undefined,
        mentorLastNameKa: dto.mentorLastNameKa ?? undefined,
        mentorBioKa: dto.mentorBioKa ?? undefined,

        titleEn:
          dto.titleEn !== undefined ? this.trimOrNull(dto.titleEn) : undefined,
        descriptionEn:
          dto.descriptionEn !== undefined
            ? this.trimOrNull(dto.descriptionEn)
            : undefined,
        syllabusEn:
          dto.syllabusEn !== undefined
            ? this.trimOrNull(dto.syllabusEn)
            : undefined,
        mentorFirstNameEn:
          dto.mentorFirstNameEn !== undefined
            ? this.trimOrNull(dto.mentorFirstNameEn)
            : undefined,
        mentorLastNameEn:
          dto.mentorLastNameEn !== undefined
            ? this.trimOrNull(dto.mentorLastNameEn)
            : undefined,
        mentorBioEn:
          dto.mentorBioEn !== undefined
            ? this.trimOrNull(dto.mentorBioEn)
            : undefined,

        enAutoTranslated: false,
        imageUrl: dto.imageUrl ?? undefined,

        originalPrice: dto.originalPrice ?? undefined,
        discountedPrice:
          dto.originalPrice !== undefined ? pricing.discountedPrice : undefined,
        discountPercent:
          dto.originalPrice !== undefined ? pricing.discountPercent : undefined,

        date: dto.date ? new Date(dto.date) : undefined,

        address,
        onlineUrl,
        startDate: startDate as any,
        endDate: endDate as any,
      },
      include: { requestVideos: true, requestMaterials: true },
    });
  }

  // =========================================================
  // ✅ FIXED: setListing — აქ ვითვლით listingEndsAt-ს ერთხელ
  // =========================================================
  async setListing(requestId: string, userId: string, listingDays: number) {
    const request = await this.getOwnedRequestOrThrow(requestId, userId);

    // ✅ VIDEO course-ს არ სჭირდება listing/payment
    if (request.type === CourseType.COURSE && request.delivery === CourseDelivery.VIDEO) {
      throw new BadRequestException('Listing payment is not required for VIDEO courses');
    }

    this.require(
      Number.isInteger(listingDays) && listingDays >= 1 && listingDays <= MAX_LISTING_DAYS,
      `listingDays must be between 1 and ${MAX_LISTING_DAYS}`,
    );

    const listingFee = listingDays * LISTING_PRICE_PER_DAY;

    // ✅ start ერთჯერადად: თუ არ ჰქონდა — ახლა; თუ ჰქონდა — იგივე (სტაბილური დათვლა)
    const startsAt = request.listingStartsAt ?? new Date();
    const endsAt = addDays(startsAt, listingDays);

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: {
        listingDays,
        listingFee,
        listingStartsAt: startsAt,
        listingEndsAt: endsAt,
        status: CourseRequestStatus.PENDING_PAYMENT,
      },
    });
  }

  async markAsPaid(requestId: string, userId: string) {
    const request = await this.getOwnedRequestOrThrow(requestId, userId);

    this.require(
      request.status === CourseRequestStatus.PENDING_PAYMENT,
      'Request is not awaiting payment',
    );

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.PAID },
    });
  }

  // -----------------------------
  // SUBMIT FOR APPROVAL (შენი ლოგიკა + პატარა დაცვა)
  // -----------------------------
  async submitForApproval(requestId: string, userId: string, role?: Role) {
    await this.getOwnedRequestOrThrow(requestId, userId, {
      requestVideos: true,
    });

    const updated = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
      include: { requestVideos: true, requestMaterials: true },
    });
    if (!updated) throw new NotFoundException('Course request not found');

    this.validateEnglishGroupOnRecord(updated);

    this.require(!!updated.category, 'Category is required');
    this.require(!!updated.imageUrl, 'Image is required');
    this.require(!!updated.titleKa?.trim(), 'Title (KA) is required');
    this.require(!!updated.descriptionKa?.trim(), 'Description (KA) is required');
    this.require(!!updated.teachingLanguage, 'Teaching language is required');

    const adminAutoPublish = this.isAdminRole(role);

    // WORKSHOP / MASTERCLASS
    if (updated.type !== CourseType.COURSE) {
      this.require(!!updated.date, 'Date is required for workshop/masterclass');

      // ✅ listing required
      this.require(!!updated.listingDays, 'listingDays required');
      this.require(!!updated.listingEndsAt, 'listingEndsAt missing. Call /listing first');

      this.require(!!updated.format, 'Format is required');

      if (updated.format === CourseFormat.ONSITE) {
        this.require(!!updated.address?.trim(), 'Address is required for on-site');
      }
      if (updated.format === CourseFormat.ONLINE) {
        this.require(!!updated.onlineUrl?.trim(), 'Online link is required for online');
      }

      if (adminAutoPublish) {
        await this.prisma.courseRequest.update({
          where: { id: requestId },
          data: { status: CourseRequestStatus.PENDING_APPROVAL },
        });
        return this.approve(requestId);
      }

      return this.prisma.courseRequest.update({
        where: { id: requestId },
        data: { status: CourseRequestStatus.PENDING_APPROVAL },
      });
    }

    // COURSE common rules
    this.require(!!updated.syllabusKa?.trim(), 'Syllabus is required for course');
    this.require(!!updated.mentorFirstNameKa?.trim(), 'Mentor first name is required');
    this.require(!!updated.mentorLastNameKa?.trim(), 'Mentor last name is required');

    const anyContentEn =
      !!this.trimOrNull(updated.titleEn) ||
      !!this.trimOrNull(updated.descriptionEn) ||
      !!this.trimOrNull(updated.syllabusEn);

    if (anyContentEn) {
      this.require(
        !!this.trimOrNull(updated.syllabusEn),
        'syllabusEn is required when English is provided for course',
      );
    }

    const delivery = updated.delivery ?? CourseDelivery.LIVE;

    // COURSE: VIDEO
    if (delivery === CourseDelivery.VIDEO) {
      this.require(!!updated.requestVideos?.length, 'At least 1 video is required for video course');
      this.require(updated.requestVideos.length <= 25, 'Max 25 videos allowed');

      const patchData: any = {
        delivery: CourseDelivery.VIDEO,
        format: null,
        address: null,
        onlineUrl: null,
        startDate: null,
        endDate: null,
        status: CourseRequestStatus.PENDING_APPROVAL,
        // ✅ listing fields null for video
        listingDays: null,
        listingFee: null,
        listingStartsAt: null,
        listingEndsAt: null,
      };

      if (adminAutoPublish) {
        await this.prisma.courseRequest.update({ where: { id: requestId }, data: patchData });
        return this.approve(requestId);
      }

      return this.prisma.courseRequest.update({ where: { id: requestId }, data: patchData });
    }

    // COURSE: LIVE
    this.require(!!updated.format, 'Format is required for live course');

    if (updated.format === CourseFormat.ONSITE) {
      this.require(!!updated.address?.trim(), 'Address is required for on-site');
    }
    if (updated.format === CourseFormat.ONLINE) {
      this.require(!!updated.onlineUrl?.trim(), 'Online link is required for online');
    }

    this.require(!!updated.startDate, 'Start date is required for live course');

    // ✅ listing required
    this.require(!!updated.listingDays, 'listingDays required for live course listing');
    this.require(!!updated.listingEndsAt, 'listingEndsAt missing. Call /listing first');

    if (adminAutoPublish) {
      await this.prisma.courseRequest.update({
        where: { id: requestId },
        data: {
          delivery: CourseDelivery.LIVE,
          status: CourseRequestStatus.PENDING_APPROVAL,
        },
      });
      return this.approve(requestId);
    }

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: {
        delivery: CourseDelivery.LIVE,
        status: CourseRequestStatus.PENDING_APPROVAL,
      },
    });
  }

  async getPendingRequests() {
    return this.prisma.courseRequest.findMany({
      where: { status: CourseRequestStatus.PENDING_APPROVAL },
      include: { creator: true, requestVideos: true, requestMaterials: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================================================
  // ✅ FIXED: approve — აღარ ვთვლით new Date()-დან
  // =========================================================
  async approve(requestId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
      include: { requestVideos: true, requestMaterials: true },
    });
    if (!request) throw new NotFoundException('Course request not found');

    if (request.status !== CourseRequestStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('Request must be PENDING_APPROVAL');
    }

    const effectiveDelivery =
      request.type === CourseType.COURSE
        ? request.delivery ?? CourseDelivery.LIVE
        : CourseDelivery.LIVE;

    const isVideo = request.type === CourseType.COURSE && effectiveDelivery === CourseDelivery.VIDEO;

    // ✅ listingEndsAt:
    // - VIDEO => null
    // - LIVE/WORKSHOP => request.listingEndsAt (დათვლილი setListing-ში)
    //   fallback: თუ ძველი მონაცემებია და null დარჩა, მაინც დავთვალოთ startsAt-დან.
    const listingEndsAt = isVideo
      ? null
      : (request.listingEndsAt ??
          (request.listingDays && request.listingDays > 0
            ? addDays(request.listingStartsAt ?? new Date(), request.listingDays)
            : null));

    if (!isVideo) {
      this.require(!!listingEndsAt, 'listingEndsAt is required for LIVE/WORKSHOP');
    }

    let pricingFinal = {
      originalPrice: 0,
      discountedPrice: null as number | null,
      discountPercent: null as number | null,
    };

    if (request.originalPrice !== null && request.originalPrice !== undefined) {
      pricingFinal = computePricing(
        request.originalPrice,
        request.discountedPrice ?? null,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const slug = this.makeSlug(request.titleEn ?? request.titleKa);

      const effectiveFormat =
        request.type === CourseType.COURSE && isVideo
          ? CourseFormat.ONLINE
          : (request.format as CourseFormat);

      const createdCourse = await tx.course.create({
        data: {
          slug,
          type: request.type,
          creatorId: request.creatorId,

          category: request.category!,
          format: effectiveFormat,
          delivery: effectiveDelivery,

          imageUrl: request.imageUrl ?? '',

          address: effectiveDelivery === CourseDelivery.LIVE ? request.address : null,
          onlineUrl: effectiveDelivery === CourseDelivery.LIVE ? request.onlineUrl : null,

          teachingLanguage: request.teachingLanguage ?? TeachingLanguage.KA,

          titleKa: request.titleKa,
          descriptionKa: request.descriptionKa,
          syllabusKa: request.syllabusKa,
          mentorBioKa: request.mentorBioKa,
          mentorFirstNameKa: request.mentorFirstNameKa,
          mentorLastNameKa: request.mentorLastNameKa,

          titleEn: request.titleEn ?? null,
          descriptionEn: request.descriptionEn ?? null,
          syllabusEn: request.syllabusEn ?? null,
          mentorBioEn: request.mentorBioEn ?? null,
          mentorFirstNameEn: request.mentorFirstNameEn ?? null,
          mentorLastNameEn: request.mentorLastNameEn ?? null,

          startDate: effectiveDelivery === CourseDelivery.LIVE ? request.startDate : null,
          endDate: effectiveDelivery === CourseDelivery.LIVE ? request.endDate : null,
          date: request.date,

          listingEndsAt,
          status: CourseStatus.ACTIVE,

          originalPrice: request.originalPrice ?? 0,
          discountedPrice: pricingFinal.discountedPrice,
          discountPercent: pricingFinal.discountPercent,

          videos:
            request.type === CourseType.COURSE &&
            isVideo &&
            request.requestVideos?.length
              ? { create: request.requestVideos.map((v) => ({ url: v.url })) }
              : undefined,

          materials:
            request.requestMaterials?.length
              ? {
                  create: request.requestMaterials.map((m) => ({ link: m.link })),
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
    if (!request) throw new NotFoundException('Course request not found');

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.REJECTED },
    });
  }

  async adminUpdateRequest(id: string, dto: any) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Course request not found');

    let pricingData = {};
    if (dto.originalPrice !== undefined) {
      const p = computePricing(dto.originalPrice, dto.discountedPrice ?? null);
      pricingData = {
        originalPrice: p.originalPrice,
        discountedPrice: p.discountedPrice,
        discountPercent: p.discountPercent,
      };
    }

    return this.prisma.courseRequest.update({
      where: { id },
      data: {
        ...dto,
        ...pricingData,
        date: dto.date ? new Date(dto.date) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }
}
