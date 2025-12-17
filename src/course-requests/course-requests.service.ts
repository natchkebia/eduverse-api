import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseRequestStatus, CourseStatus } from '@prisma/client';
import { addDays } from 'date-fns';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';

@Injectable()
export class CourseRequestsService {
  constructor(private prisma: PrismaService) {}

  // STEP 1 — USER creates DRAFT (basic info only)
  async createDraft(userId: string, dto: CreateCourseRequestDto) {
    return this.prisma.courseRequest.create({
      data: {
        creator: {
          connect: { id: userId },
        },
        type: dto.type,
        titleKa: dto.titleKa,
        titleEn: dto.titleEn,
        descriptionKa: dto.descriptionKa,
        descriptionEn: dto.descriptionEn,
        imageUrl: dto.imageUrl,
        status: CourseRequestStatus.DRAFT,
      },
    });
  }

  // STEP 2 — USER sets days + price
  async setDetails(
    requestId: string,
    userId: string,
    days: number,
    price: number,
  ) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Course request not found');
    if (request.creatorId !== userId) throw new ForbiddenException();

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: {
        days,
        price,
        status: CourseRequestStatus.PENDING_PAYMENT,
      },
    });
  }

  // STEP 3 — USER fake payment (later real bank)
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

  // STEP 4 — USER submits to admin
  async submitForApproval(requestId: string, userId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Course request not found');
    if (request.creatorId !== userId) throw new ForbiddenException();

    if (request.status !== CourseRequestStatus.PAID) {
      throw new ForbiddenException('Payment required');
    }

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.PENDING_APPROVAL },
    });
  }

  // ADMIN — list pending requests
  async getPendingRequests() {
    return this.prisma.courseRequest.findMany({
      where: { status: CourseRequestStatus.PENDING_APPROVAL },
      include: { creator: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ADMIN — approve and create real Course
  async approve(requestId: string) {
    const request = await this.prisma.courseRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Course request not found');
    if (!request.days || !request.price) {
      throw new ForbiddenException('Days or price missing');
    }

    await this.prisma.course.create({
      data: {
        slug: `${(request.titleEn ?? request.titleKa)
          .toLowerCase()
          .replace(/\s+/g, '-')}-${Date.now()}`,

        type: request.type,

        originalPrice: request.price,
        discountedPrice: request.price,

        imageUrl: request.imageUrl ?? '',

        titleKa: request.titleKa,
        titleEn: request.titleEn ?? request.titleKa,

        descriptionKa: request.descriptionKa,
        descriptionEn: request.descriptionEn ?? request.descriptionKa,

        altTextKa: request.titleKa,
        altTextEn: request.titleEn ?? request.titleKa,

        buttonKa: 'დარეგისტრირება',
        buttonEn: 'Register',
        formatKa: 'ონლაინ',
        formatEn: 'Online',
        languageKa: 'ქართული',
        languageEn: 'Georgian',

        startDate: new Date(),
        endDate: addDays(new Date(), request.days),

        status: CourseStatus.ACTIVE,
      },
    });

    return this.prisma.courseRequest.update({
      where: { id: requestId },
      data: { status: CourseRequestStatus.APPROVED },
    });
  }

  // ADMIN — reject
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
