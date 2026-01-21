import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { addDays, addHours } from "date-fns";
import { CourseStatus, CourseType } from "@prisma/client";
import { Cron, CronExpression } from "@nestjs/schedule";
import { computePricing } from "../common/pricing/pricing";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async searchCourses(query: string, locale: string = "ka") {
    const isEn = locale === "en";

    return this.prisma.course.findMany({
      where: {
        ...(isEn ? { titleEn: { not: null } } : {}),
        OR: isEn
          ? [
              { titleEn: { contains: query, mode: "insensitive" } },
              { descriptionEn: { contains: query, mode: "insensitive" } },
            ]
          : [
              { titleKa: { contains: query, mode: "insensitive" } },
              { descriptionKa: { contains: query, mode: "insensitive" } },
            ],
      },
      orderBy: { createdAt: "desc" },
      include: { videos: true, materials: true },
    });
  }

  async getPublicCourses(type?: CourseType, locale: string = "ka") {
    const isEn = locale === "en";

    return this.prisma.course.findMany({
      where: {
        status: { in: [CourseStatus.ACTIVE, CourseStatus.EXPIRING] },
        ...(type ? { type } : {}),
        ...(isEn ? { titleEn: { not: null } } : {}),
      },
      orderBy: { createdAt: "desc" },
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

  /**
   * ✍️ CREATE (ADMIN)
   * - supports pricing with/without discount
   * - explicit fields only (no mass assignment)
   * - ❌ no `discount` string saved (removed from schema)
   */
  async createCourse(dto: CreateCourseDto) {
    let pricing: {
      originalPrice: number;
      discountedPrice: number | null;
      discountPercent: number | null;
    };

    try {
      pricing = computePricing(dto.originalPrice, dto.discountedPrice ?? null);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }

    return this.prisma.course.create({
      data: {
        slug: dto.slug,
        type: dto.type ?? CourseType.COURSE,

        originalPrice: pricing.originalPrice,
        discountedPrice: pricing.discountedPrice,
        discountPercent: pricing.discountPercent,

        imageUrl: dto.imageUrl,

        titleKa: dto.titleKa,
        descriptionKa: dto.descriptionKa,
        altTextKa: dto.altTextKa,
        buttonKa: dto.buttonKa,
        formatKa: dto.formatKa,
        languageKa: dto.languageKa,

        titleEn: dto.titleEn ?? null,
        descriptionEn: dto.descriptionEn ?? null,
        altTextEn: dto.altTextEn ?? null,
        buttonEn: dto.buttonEn ?? null,
        formatEn: dto.formatEn ?? null,
        languageEn: dto.languageEn ?? null,

        // ✅ listing expiry for cron/status
        listingEndsAt: addDays(new Date(), dto.duration),

        status: CourseStatus.ACTIVE,
      },
    });
  }

  async extendCourse(id: number, duration: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException("Course not found");

    const base = course.listingEndsAt ?? new Date();

    return this.prisma.course.update({
      where: { id },
      data: {
        listingEndsAt: addDays(base, duration),
        status: CourseStatus.ACTIVE,
      },
    });
  }

  /**
   * ⏱️ STATUS CRON (uses listingEndsAt)
   */
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
