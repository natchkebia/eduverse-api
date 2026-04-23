import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { addDays, addHours } from 'date-fns';
import {
  CourseStatus,
  CourseType,
  CourseDelivery,
  CourseFormat,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { computePricing } from '../common/pricing/pricing';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── USER: get my created courses ──────────────────────────────────────────
  async getMyCourses(userId: string, status?: CourseStatus) {
    return this.prisma.course.findMany({
      where: {
        creatorId: userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { videos: true, materials: true },
    });
  }

  // ─── Search ─────────────────────────────────────────────────────────────────
  async searchCourses(query: string, locale: string = 'ka') {
    const isEn = locale === 'en';

    return this.prisma.course.findMany({
      where: {
        ...(isEn
          ? {
              OR: [
                { contentLocale: 'en' },
                {
                  AND: [
                    { titleKa: { not: null } },
                    { descriptionKa: { not: null } },
                    { titleEn: { not: null } },
                    { descriptionEn: { not: null } },
                  ],
                },
              ],
            }
          : {
              OR: [
                { contentLocale: 'ka' },
                {
                  AND: [
                    { titleKa: { not: null } },
                    { descriptionKa: { not: null } },
                    { titleEn: { not: null } },
                    { descriptionEn: { not: null } },
                  ],
                },
              ],
            }),

        AND: [
          isEn
            ? {
                OR: [
                  { titleEn: { contains: query, mode: 'insensitive' } },
                  { descriptionEn: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {
                OR: [
                  { titleKa: { contains: query, mode: 'insensitive' } },
                  { descriptionKa: { contains: query, mode: 'insensitive' } },
                ],
              },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { videos: true, materials: true },
    });
  }

  // ─── Public courses ─────────────────────────────────────────────────────────
  async getPublicCourses(type?: CourseType, locale: string = 'ka') {
    const isEn = locale === 'en';

    return this.prisma.course.findMany({
      where: {
        status: { in: [CourseStatus.ACTIVE, CourseStatus.EXPIRING] },
        ...(type ? { type } : {}),
        ...(isEn
          ? {
              OR: [
                { contentLocale: 'en' },
                {
                  AND: [
                    { titleKa: { not: null } },
                    { descriptionKa: { not: null } },
                    { titleEn: { not: null } },
                    { descriptionEn: { not: null } },
                  ],
                },
              ],
            }
          : {
              OR: [
                { contentLocale: 'ka' },
                {
                  AND: [
                    { titleKa: { not: null } },
                    { descriptionKa: { not: null } },
                    { titleEn: { not: null } },
                    { descriptionEn: { not: null } },
                  ],
                },
              ],
            }),
      },
      orderBy: { createdAt: 'desc' },
      include: { videos: true, materials: true },
    });
  }

  async getActiveCourses() {
    return this.prisma.course.findMany({
      where: { status: CourseStatus.ACTIVE },
      include: { videos: true, materials: true },
    });
  }

  async getExpiringCourses() {
    return this.prisma.course.findMany({
      where: { status: CourseStatus.EXPIRING },
      include: { videos: true, materials: true },
    });
  }

  async getArchivedCourses() {
    return this.prisma.course.findMany({
      where: { status: { in: [CourseStatus.EXPIRED, CourseStatus.ARCHIVED] } },
      include: { videos: true, materials: true },
    });
  }

  async findOneById(id: number) {
    return this.prisma.course.findUnique({
      where: { id },
      include: { videos: true, materials: true },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: { videos: true, materials: true },
    });
  }

  // ─── ADMIN: update course (explicit field mapping — no raw spread) ───────────
  async updateCourse(id: number, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    let pricingData: {
      originalPrice?: number;
      discountedPrice?: number | null;
      discountPercent?: number | null;
    } = {};

    if (dto.originalPrice !== undefined) {
      const p = computePricing(dto.originalPrice, dto.discountedPrice ?? null);
      pricingData = {
        originalPrice: p.originalPrice,
        discountedPrice: p.discountedPrice,
        discountPercent: p.discountPercent,
      };
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        // Only explicitly allowed fields — no raw spread
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.delivery !== undefined && { delivery: dto.delivery }),
        ...(dto.format !== undefined && { format: dto.format }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.isGeorgia !== undefined && { isGeorgia: dto.isGeorgia }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.onlineUrl !== undefined && { onlineUrl: dto.onlineUrl }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.titleKa !== undefined && { titleKa: dto.titleKa }),
        ...(dto.descriptionKa !== undefined && { descriptionKa: dto.descriptionKa }),
        ...(dto.syllabusKa !== undefined && { syllabusKa: dto.syllabusKa }),
        ...(dto.mentorFirstNameKa !== undefined && { mentorFirstNameKa: dto.mentorFirstNameKa }),
        ...(dto.mentorLastNameKa !== undefined && { mentorLastNameKa: dto.mentorLastNameKa }),
        ...(dto.mentorBioKa !== undefined && { mentorBioKa: dto.mentorBioKa }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.descriptionEn !== undefined && { descriptionEn: dto.descriptionEn }),
        ...(dto.syllabusEn !== undefined && { syllabusEn: dto.syllabusEn }),
        ...(dto.mentorFirstNameEn !== undefined && { mentorFirstNameEn: dto.mentorFirstNameEn }),
        ...(dto.mentorLastNameEn !== undefined && { mentorLastNameEn: dto.mentorLastNameEn }),
        ...(dto.mentorBioEn !== undefined && { mentorBioEn: dto.mentorBioEn }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.listingDays && {
          listingEndsAt: addDays(course.listingEndsAt ?? new Date(), dto.listingDays),
        }),
        ...pricingData,
      },
    });
  }

  // ─── ADMIN: delete course ────────────────────────────────────────────────────
  async deleteCourse(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { videos: true, materials: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Videos and materials cascade on delete via schema — explicit deletes for safety
    await this.prisma.video.deleteMany({ where: { courseId: id } });
    await this.prisma.material.deleteMany({ where: { courseId: id } });
    return this.prisma.course.delete({ where: { id } });
  }

  async updateCourseImage(id: number, imageUrl: string | null) {
    return this.prisma.course.update({
      where: { id },
      data: { imageUrl: imageUrl ?? '' },
    });
  }

  // ─── ADMIN: create course ────────────────────────────────────────────────────
  async createCourse(dto: CreateCourseDto) {
    let pricing: ReturnType<typeof computePricing>;
    try {
      pricing = computePricing(dto.originalPrice, dto.discountedPrice ?? null);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }

    const type = dto.type ?? CourseType.COURSE;
    const format = dto.format ?? CourseFormat.ONLINE;
    const delivery = dto.delivery ?? CourseDelivery.LIVE;
    const listingEndsAt = dto.listingDays
      ? addDays(new Date(), dto.listingDays)
      : null;

    return this.prisma.course.create({
      data: {
        slug: dto.slug,
        type,
        category: dto.category ?? undefined,
        format,
        delivery,
        imageUrl: dto.imageUrl,
        isGeorgia: dto.isGeorgia ?? true,
        address: format === CourseFormat.ONSITE ? (dto.address ?? null) : null,
        onlineUrl: format === CourseFormat.ONLINE ? (dto.onlineUrl ?? null) : null,
        titleKa: dto.titleKa,
        descriptionKa: dto.descriptionKa,
        syllabusKa: dto.syllabusKa ?? null,
        mentorFirstNameKa: dto.mentorFirstNameKa ?? null,
        mentorLastNameKa: dto.mentorLastNameKa ?? null,
        mentorBioKa: dto.mentorBioKa ?? null,
        titleEn: dto.titleEn ?? null,
        descriptionEn: dto.descriptionEn ?? null,
        syllabusEn: dto.syllabusEn ?? null,
        mentorFirstNameEn: dto.mentorFirstNameEn ?? null,
        mentorLastNameEn: dto.mentorLastNameEn ?? null,
        mentorBioEn: dto.mentorBioEn ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        date: dto.date ? new Date(dto.date) : null,
        listingEndsAt,
        status: CourseStatus.ACTIVE,
        originalPrice: pricing.originalPrice,
        discountedPrice: pricing.discountedPrice,
        discountPercent: pricing.discountPercent,
      },
    });
  }

  // ─── ADMIN: extend course listing ────────────────────────────────────────────
  async extendCourse(id: number, duration: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    const base = course.listingEndsAt ?? new Date();

    return this.prisma.course.update({
      where: { id },
      data: {
        listingEndsAt: addDays(base, duration),
        status: CourseStatus.ACTIVE,
      },
    });
  }

  // ─── Cron: auto-update course statuses ───────────────────────────────────────
  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateCourseStatuses() {
    const now = new Date();
    const in24Hours = addHours(now, 24);

    await this.prisma.course.updateMany({
      where: {
        status: CourseStatus.ACTIVE,
        listingEndsAt: { lte: in24Hours, gt: now },
      },
      data: { status: CourseStatus.EXPIRING },
    });

    await this.prisma.course.updateMany({
      where: {
        status: CourseStatus.EXPIRING,
        listingEndsAt: { lte: now },
      },
      data: { status: CourseStatus.EXPIRED },
    });
  }
}