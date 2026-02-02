import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { addDays, addHours } from 'date-fns';
import { CourseStatus, CourseType, CourseDelivery, CourseFormat } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { computePricing } from '../common/pricing/pricing';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async searchCourses(query: string, locale: string = 'ka') {
    const isEn = locale === 'en';
    return this.prisma.course.findMany({
      where: {
        ...(isEn ? { titleEn: { not: null } } : {}),
        OR: isEn
          ? [
              { titleEn: { contains: query, mode: 'insensitive' } },
              { descriptionEn: { contains: query, mode: 'insensitive' } },
            ]
          : [
              { titleKa: { contains: query, mode: 'insensitive' } },
              { descriptionKa: { contains: query, mode: 'insensitive' } },
            ],
      },
      orderBy: { createdAt: 'desc' },
      include: { videos: true, materials: true },
    });
  }

  async getPublicCourses(type?: CourseType, locale: string = 'ka') {
    const isEn = locale === 'en';
    return this.prisma.course.findMany({
      where: {
        status: { in: [CourseStatus.ACTIVE, CourseStatus.EXPIRING] },
        ...(type ? { type } : {}),
        ...(isEn ? { titleEn: { not: null } } : {}),
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

  /**
   * ✅ ADMIN UPDATE
   */
  async updateCourse(id: number, dto: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    let pricingData = {};
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
        ...dto,
        ...pricingData,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async updateCourseImage(id: number, imageUrl: string | null) {
    return this.prisma.course.update({
      where: { id },
      data: { imageUrl: imageUrl ?? "" },
    });
  }

  async createCourse(dto: CreateCourseDto) {
    let pricing: any;
    try {
      pricing = computePricing(dto.originalPrice, dto.discountedPrice ?? null);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }

    const type = dto.type ?? CourseType.COURSE;
    const format = dto.format ?? CourseFormat.ONLINE;
    const delivery = dto.delivery ?? CourseDelivery.LIVE;
    const listingEndsAt = dto.listingDays ? addDays(new Date(), dto.listingDays) : null;

    return this.prisma.course.create({
      data: {
        slug: dto.slug,
        type,
        category: dto.category ?? undefined,
        format,
        delivery,
        imageUrl: dto.imageUrl,
        isGeorgia: dto.isGeorgia ?? true,
        address: format === CourseFormat.ONSITE ? dto.address ?? null : null,
        onlineUrl: format === CourseFormat.ONLINE ? dto.onlineUrl ?? null : null,
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

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateCourseStatuses() {
    const now = new Date();
    const in24Hours = addHours(now, 24); // ✅ გასწორდა: ცვლადის სახელი

    await this.prisma.course.updateMany({
      where: {
        status: CourseStatus.ACTIVE,
        listingEndsAt: {
          lte: in24Hours,
          gt: now,
        },
      },
      data: { status: CourseStatus.EXPIRING },
    });

    await this.prisma.course.updateMany({
      where: {
        status: CourseStatus.EXPIRING,
        listingEndsAt: {
          lte: now,
        },
      },
      data: { status: CourseStatus.EXPIRED },
    });
  }
}