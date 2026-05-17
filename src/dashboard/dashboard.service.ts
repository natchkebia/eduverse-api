import { Injectable } from '@nestjs/common';
import { CourseRequestStatus, CourseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getPurchasedCourses(userId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: { videos: true, materials: true },
        },
      },
    });
  }

  async getCreatedCourses(userId: string) {
    return this.prisma.course.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { videos: true, materials: true },
    });
  }

  async getCourseRequests(userId: string) {
    return this.prisma.courseRequest.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { requestVideos: true, requestMaterials: true },
    });
  }

  async getSummary(userId: string) {
    const [
      purchasedCourses,
      activeCreatedCourses,
      courseRequests,
      pendingCourseRequests,
      supportConversations,
    ] = await Promise.all([
      this.prisma.courseEnrollment.count({ where: { userId } }),
      this.prisma.course.count({
        where: {
          creatorId: userId,
          status: { in: [CourseStatus.ACTIVE, CourseStatus.EXPIRING] },
        },
      }),
      this.prisma.courseRequest.count({ where: { creatorId: userId } }),
      this.prisma.courseRequest.count({
        where: {
          creatorId: userId,
          status: {
            in: [
              CourseRequestStatus.PENDING_PAYMENT,
              CourseRequestStatus.PAID,
              CourseRequestStatus.PENDING_APPROVAL,
            ],
          },
        },
      }),
      this.prisma.chatConversation.findMany({
        where: { userId },
        select: {
          userReadAt: true,
          messages: {
            where: { senderId: { not: userId } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
    ]);
    const unreadSupportConversations = supportConversations.filter(
      (conversation) =>
        conversation.messages[0] &&
        (!conversation.userReadAt ||
          conversation.messages[0].createdAt > conversation.userReadAt),
    ).length;

    return {
      purchasedCourses,
      activeCreatedCourses,
      courseRequests,
      pendingCourseRequests,
      unreadSupportConversations,
    };
  }
}
