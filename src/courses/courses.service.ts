import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { addDays, addHours } from 'date-fns';
import { CourseStatus, CourseType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /** -------------------------
   * 🔍 DATABASE SEARCH LOGIC
   * ------------------------- */
  async searchCourses(query: string, locale: string) {
    return this.prisma.course.findMany({
      where: {
        OR: [
          { titleKa: { contains: query, mode: 'insensitive' } },
          { titleEn: { contains: query, mode: 'insensitive' } },
          { descriptionKa: { contains: query, mode: 'insensitive' } },
          { descriptionEn: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async getPublicCourses(type?: CourseType) {
    return this.prisma.course.findMany({
      where: {
        status: {
          in: [CourseStatus.ACTIVE, CourseStatus.EXPIRING],
        },
        ...(type ? { type } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async getActiveCourses() {
    return this.prisma.course.findMany({
      where: {
        status: CourseStatus.ACTIVE,
      },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async getExpiringCourses() {
    return this.prisma.course.findMany({
      where: {
        status: CourseStatus.EXPIRING,
      },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async getArchivedCourses() {
    return this.prisma.course.findMany({
      where: {
        status: {
          in: [CourseStatus.EXPIRED, CourseStatus.ARCHIVED],
        },
      },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async findOneById(id: number) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async createCourse(data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...data,
        startDate: new Date(),
        endDate: addDays(new Date(), data.duration),
        status: CourseStatus.ACTIVE,
      },
    });
  }

  async extendCourse(id: number, duration: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        endDate: addDays(course.endDate ?? new Date(), duration),
        status: CourseStatus.ACTIVE,
      },
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateCourseStatuses() {
    const now = new Date();
    const in24Hours = addHours(now, 24);

    await this.prisma.course.updateMany({
      where: {
        status: CourseStatus.ACTIVE,
        endDate: {
          lte: in24Hours,
          gt: now,
        },
      },
      data: {
        status: CourseStatus.EXPIRING,
      },
    });

    await this.prisma.course.updateMany({
      where: {
        status: CourseStatus.EXPIRING,
        endDate: {
          lte: now,
        },
      },
      data: {
        status: CourseStatus.EXPIRED,
      },
    });
  }
}
