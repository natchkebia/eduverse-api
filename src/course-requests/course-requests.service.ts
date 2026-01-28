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
} from '@prisma/client';
import { addDays } from 'date-fns';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';
import { computePricing } from '../common/pricing/pricing';

const LISTING_PRICE_PER_DAY = 5;

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

  /**
   * ✅ EN group წესები:
   * - თუ titleEn მოვიდა -> descriptionEn აუცილებელია (და COURSE-ზე syllabusEnაც)
   * - mentorFirstNameEn და mentorLastNameEn ან ორივე ერთად, ან არცერთი
   */
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

    // content group: თუ რომელიმეა შევსებული, title+desc მაინც იყოს
    if (anyContentEn) {
      this.require(!!titleEn, 'titleEn required when providing English fields');
      this.require(
        !!descEn,
        'descriptionEn required when providing English fields',
      );
      // syllabusEn required only for COURSE when english is provided (validate at submit)
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
      this.require(
        !!titleEn,
        'titleEn required when English content is provided',
      );
      this.require(
        !!descEn,
        'descriptionEn required when English content is provided',
      );
      // syllabusEn required only for COURSE in submit validation
    }

    if (anyMentorEn) {
      this.require(
        !!mfEn && !!mlEn,
        'mentorFirstNameEn and mentorLastNameEn are required together (if English mentor fields provided)',
      );
    }
  }

  // STEP 1 — create draft
  async createDraft(userId: string, dto: CreateCourseRequestDto) {
    this.validateEnglishGroupOnDto(dto);

    // delivery only meaningful for COURSE
    const delivery =
      dto.type === CourseType.COURSE
        ? dto.delivery ?? CourseDelivery.LIVE
        : null;

    // pricing
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

    const format = dto.format ?? null;
    const address =
      format === CourseFormat.ONSITE ? this.trimOrNull(dto.address) : null;
    const onlineUrl =
      format === CourseFormat.ONLINE ? this.trimOrNull(dto.onlineUrl) : null;

    // KA
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

    // EN -> store or null
    const titleEn = this.trimOrNull(dto.titleEn);
    const descriptionEn = this.trimOrNull(dto.descriptionEn);
    const syllabusEn = this.trimOrNull(dto.syllabusEn);

    const mentorFirstNameEn = this.trimOrNull(dto.mentorFirstNameEn);
    const mentorLastNameEn = this.trimOrNull(dto.mentorLastNameEn);
    const mentorBioEn = this.trimOrNull(dto.mentorBioEn);

    return this.prisma.courseRequest.create({
      data: {
        creator: { connect: { id: userId } },

        type: dto.type,
        category: dto.category ?? null,
        format: format as any,
        delivery: delivery as any,

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

  // update draft (partial)
  async updateDraft(
    requestId: string,
    userId: string,
    dto: Partial<CreateCourseRequestDto>,
  ) {
    const request = await this.getOwnedRequestOrThrow(requestId, userId);

    this.validateEnglishGroupOnDto(dto);

    // recompute pricing if originalPrice sent
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
        : null;

    const nextFormat = (dto.format ?? request.format) as CourseFormat | null;

    const address =
      nextFormat === CourseFormat.ONSITE
        ? this.trimOrNull(dto.address) ?? request.address ?? null
        : null;

    const onlineUrl =
      nextFormat === CourseFormat.ONLINE
        ? this.trimOrNull(dto.onlineUrl) ?? request.onlineUrl ?? null
        : null;

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: {
        category: dto.category ?? undefined,
        format: dto.format ?? undefined,
        delivery: (nextDelivery as any) ?? undefined,

        titleKa: dto.titleKa ?? undefined,
        descriptionKa: dto.descriptionKa ?? undefined,
        syllabusKa: dto.syllabusKa ?? undefined,
        mentorFirstNameKa: dto.mentorFirstNameKa ?? undefined,
        mentorLastNameKa: dto.mentorLastNameKa ?? undefined,
        mentorBioKa: dto.mentorBioKa ?? undefined,

        // ✅ EN: store as-is, never translate
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
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,

        address,
        onlineUrl,
      },
      include: { requestVideos: true, requestMaterials: true },
    });
  }

  async setListing(requestId: string, userId: string, listingDays: number) {
    await this.getOwnedRequestOrThrow(requestId, userId);

    this.require(
      Number.isInteger(listingDays) && listingDays >= 1,
      'listingDays must be >= 1',
    );

    const listingFee = listingDays * LISTING_PRICE_PER_DAY;

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

  // ✅ USER -> pending approval, ADMIN -> auto approve + publish
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

    // common required
    this.require(!!updated.category, 'Category is required');
    this.require(!!updated.format, 'Format is required');
    this.require(!!updated.imageUrl, 'Image is required');
    this.require(!!updated.titleKa?.trim(), 'Title (KA) is required');
    this.require(!!updated.descriptionKa?.trim(), 'Description (KA) is required');

    // format-specific
    if (updated.format === CourseFormat.ONSITE) {
      this.require(!!updated.address?.trim(), 'Address is required for on-site');
    }
    if (updated.format === CourseFormat.ONLINE) {
      this.require(
        !!updated.onlineUrl?.trim(),
        'Online link is required for online',
      );
    }

    const adminAutoPublish = this.isAdminRole(role);

    // WORKSHOP / MASTERCLASS rules
    if (updated.type !== CourseType.COURSE) {
      this.require(!!updated.date, 'Date is required for workshop/masterclass');
      this.require(!!updated.listingDays, 'listingDays required');
      this.require(
        updated.status === CourseRequestStatus.PAID,
        'Payment required (pay first)',
      );

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

    // COURSE rules
    this.require(!!updated.syllabusKa?.trim(), 'Syllabus is required for course');
    this.require(
      !!updated.mentorFirstNameKa?.trim(),
      'Mentor first name is required',
    );
    this.require(
      !!updated.mentorLastNameKa?.trim(),
      'Mentor last name is required',
    );

    // ✅ if English content exists on COURSE -> require syllabusEn too
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

    if (delivery === CourseDelivery.VIDEO) {
      this.require(
        !!updated.requestVideos?.length,
        'At least 1 video is required for video course',
      );
      this.require(updated.requestVideos.length <= 25, 'Max 25 videos allowed');

      if (adminAutoPublish) {
        await this.prisma.courseRequest.update({
          where: { id: requestId },
          data: {
            delivery: CourseDelivery.VIDEO,
            status: CourseRequestStatus.PENDING_APPROVAL,
          },
        });
        return this.approve(requestId);
      }

      // ✅ VIDEO course: no listing/payment required
      return this.prisma.courseRequest.update({
        where: { id: requestId },
        data: {
          delivery: CourseDelivery.VIDEO,
          status: CourseRequestStatus.PENDING_APPROVAL,
        },
      });
    }

    // LIVE course
    this.require(!!updated.startDate, 'Start date is required for live course');
    this.require(
      !!updated.listingDays,
      'listingDays required for live course listing',
    );
    this.require(
      updated.status === CourseRequestStatus.PAID,
      'Payment required (pay first)',
    );

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

  async approve(requestId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
      include: { requestVideos: true, requestMaterials: true },
    });
    if (!request) throw new NotFoundException('Course request not found');

    if (request.status !== CourseRequestStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('Request must be PENDING_APPROVAL');
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
        request.discountedPrice ?? null,
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
          delivery:
            request.type === CourseType.COURSE
              ? request.delivery ?? CourseDelivery.LIVE
              : CourseDelivery.LIVE,

          imageUrl: request.imageUrl ?? '',

          address: request.address,
          onlineUrl: request.onlineUrl,

          // i18n
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

          // dates
          startDate: request.startDate,
          endDate: request.endDate,
          date: request.date,

          listingEndsAt,
          status: CourseStatus.ACTIVE,

          // pricing
          originalPrice: request.originalPrice ?? 0,
          discountedPrice: pricingFinal.discountedPrice,
          discountPercent: pricingFinal.discountPercent,

          videos:
            request.type === CourseType.COURSE &&
            (request.delivery ?? CourseDelivery.LIVE) === CourseDelivery.VIDEO &&
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
}
