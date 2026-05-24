import { Injectable } from '@nestjs/common';
import {
  CourseListingDecisionStatus,
  CourseRequestStatus,
  CourseStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        provider: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  getCourses() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: true,
        videos: true,
        materials: true,
        listingRequests: {
          where: { status: CourseListingDecisionStatus.PENDING },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  getOrders() {
    return this.prisma.courseEnrollment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true, course: true },
    });
  }

  async getAnalyticsSummary() {
    const [
      users,
      admins,
      courses,
      activeCourses,
      courseRequests,
      pendingCourseRequests,
      pendingListingRequests,
      orders,
      chatConversations,
      openChatConversations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
      }),
      this.prisma.course.count(),
      this.prisma.course.count({
        where: { status: { in: [CourseStatus.ACTIVE, CourseStatus.EXPIRING] } },
      }),
      this.prisma.courseRequest.count(),
      this.prisma.courseRequest.count({
        where: { status: CourseRequestStatus.PENDING_APPROVAL },
      }),
      this.prisma.courseListingRequest.count({
        where: { status: CourseListingDecisionStatus.PENDING },
      }),
      this.prisma.courseEnrollment.count(),
      this.prisma.chatConversation.count(),
      this.prisma.chatConversation.count({ where: { closedAt: null } }),
    ]);

    return {
      users,
      admins,
      courses,
      activeCourses,
      courseRequests,
      pendingCourseRequests,
      pendingListingRequests,
      orders,
      chatConversations,
      openChatConversations,
    };
  }
}
