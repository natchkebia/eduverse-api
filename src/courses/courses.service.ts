import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  private async withRatingStats<T extends { id: number }>(
    courses: T[],
    userId?: string,
  ) {
    if (courses.length === 0) return courses;
    const courseIds = courses.map((course) => course.id);

    const stats = await this.prisma.courseRating.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const [userRatings, userEnrollments] = userId
      ? await Promise.all([
          this.prisma.courseRating.findMany({
            where: { userId, courseId: { in: courseIds } },
            select: { courseId: true, rating: true },
          }),
          this.prisma.courseEnrollment.findMany({
            where: { userId, courseId: { in: courseIds } },
            select: { courseId: true },
          }),
        ])
      : [[], []];

    const statsByCourseId = new Map(
      stats.map((stat) => [
        stat.courseId,
        {
          averageRating:
            stat._avg.rating === null
              ? 0
              : Math.round(stat._avg.rating * 10) / 10,
          ratingCount: stat._count.rating,
        },
      ]),
    );
    const userRatingByCourseId = new Map(
      userRatings.map((rating) => [rating.courseId, rating.rating]),
    );
    const enrolledCourseIds = new Set(
      userEnrollments.map((enrollment) => enrollment.courseId),
    );

    return courses.map((course) => ({
      ...course,
      averageRating: statsByCourseId.get(course.id)?.averageRating ?? 0,
      ratingCount: statsByCourseId.get(course.id)?.ratingCount ?? 0,
      userRating: userRatingByCourseId.get(course.id) ?? null,
      canRate: enrolledCourseIds.has(course.id),
    }));
  }

  private async withRatingStat<T extends { id: number }>(
    course: T | null,
    userId?: string,
  ) {
    if (!course) return null;
    const [courseWithStats] = await this.withRatingStats([course], userId);
    return courseWithStats;
  }

  // ─── USER: get my created courses ──────────────────────────────────────────
  async getMyCourses(userId: string, status?: CourseStatus) {
    const courses = await this.prisma.course.findMany({
      where: {
        creatorId: userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { videos: true, materials: true },
    });

    return this.withRatingStats(courses, userId);
  }

  // ─── Search ─────────────────────────────────────────────────────────────────
  async searchCourses(query: string, locale: string = 'ka', userId?: string) {
    const isEn = locale === 'en';

    const courses = await this.prisma.course.findMany({
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

    return this.withRatingStats(courses, userId);
  }

  // ─── Public courses ─────────────────────────────────────────────────────────
  async getPublicCourses(
    type?: CourseType,
    locale: string = 'ka',
    userId?: string,
  ) {
    const isEn = locale === 'en';

    const courses = await this.prisma.course.findMany({
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

    return this.withRatingStats(courses, userId);
  }

  async getActiveCourses(userId?: string) {
    const courses = await this.prisma.course.findMany({
      where: { status: CourseStatus.ACTIVE },
      include: { videos: true, materials: true },
    });

    return this.withRatingStats(courses, userId);
  }

  async getExpiringCourses() {
    const courses = await this.prisma.course.findMany({
      where: { status: CourseStatus.EXPIRING },
      include: { videos: true, materials: true },
    });

    return this.withRatingStats(courses);
  }

  async getArchivedCourses() {
    const courses = await this.prisma.course.findMany({
      where: { status: { in: [CourseStatus.EXPIRED, CourseStatus.ARCHIVED] } },
      include: { videos: true, materials: true },
    });

    return this.withRatingStats(courses);
  }

  async findOneById(id: number, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { videos: true, materials: true },
    });

    return this.withRatingStat(course, userId);
  }

  async findBySlug(slug: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: { videos: true, materials: true },
    });

    return this.withRatingStat(course, userId);
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
        ...(dto.descriptionKa !== undefined && {
          descriptionKa: dto.descriptionKa,
        }),
        ...(dto.syllabusKa !== undefined && { syllabusKa: dto.syllabusKa }),
        ...(dto.mentorFirstNameKa !== undefined && {
          mentorFirstNameKa: dto.mentorFirstNameKa,
        }),
        ...(dto.mentorLastNameKa !== undefined && {
          mentorLastNameKa: dto.mentorLastNameKa,
        }),
        ...(dto.mentorBioKa !== undefined && { mentorBioKa: dto.mentorBioKa }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.descriptionEn !== undefined && {
          descriptionEn: dto.descriptionEn,
        }),
        ...(dto.syllabusEn !== undefined && { syllabusEn: dto.syllabusEn }),
        ...(dto.mentorFirstNameEn !== undefined && {
          mentorFirstNameEn: dto.mentorFirstNameEn,
        }),
        ...(dto.mentorLastNameEn !== undefined && {
          mentorLastNameEn: dto.mentorLastNameEn,
        }),
        ...(dto.mentorBioEn !== undefined && { mentorBioEn: dto.mentorBioEn }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.listingDays && {
          listingEndsAt: addDays(
            course.listingEndsAt ?? new Date(),
            dto.listingDays,
          ),
        }),
        ...(dto.maxStudents !== undefined && { maxStudents: dto.maxStudents }),
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
    if (
      (type === CourseType.COURSE || type === CourseType.WORKSHOP) &&
      !dto.maxStudents
    ) {
      throw new BadRequestException(
        'maxStudents is required for courses and workshops',
      );
    }
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
        onlineUrl:
          format === CourseFormat.ONLINE ? (dto.onlineUrl ?? null) : null,
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
        maxStudents: dto.maxStudents ?? null,
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

  async enrollInCourse(courseId: number, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { id: true, type: true, maxStudents: true },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      const shouldEnforceCapacity =
        (course.type === CourseType.COURSE ||
          course.type === CourseType.WORKSHOP) &&
        course.maxStudents !== null;

      if (shouldEnforceCapacity) {
        const currentEnrollments = await tx.courseEnrollment.count({
          where: { courseId },
        });

        if (currentEnrollments >= (course.maxStudents as number)) {
          throw new BadRequestException(
            'Registration limit reached for this course',
          );
        }
      }

      try {
        await tx.courseEnrollment.create({
          data: { courseId, userId },
        });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new ConflictException('You are already registered');
        }
        throw error;
      }

      return { success: true };
    });
  }

  async rateCourse(courseId: number, userId: string, rating: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new ForbiddenException('You can rate only purchased courses');
    }

    await this.prisma.courseRating.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        userId,
        courseId,
        rating,
      },
      update: {
        rating,
      },
    });

    const stats = await this.prisma.courseRating.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      success: true,
      courseId,
      userRating: rating,
      averageRating:
        stats._avg.rating === null
          ? 0
          : Math.round(stats._avg.rating * 10) / 10,
      ratingCount: stats._count.rating,
    };
  }
}
