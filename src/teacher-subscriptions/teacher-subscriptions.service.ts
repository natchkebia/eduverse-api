import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherSubscriptionStatus } from '@prisma/client';
import { addDays } from 'date-fns';

export const TEACHER_SUBSCRIPTION_MONTHLY_FEE = 30;
const SUBSCRIPTION_PERIOD_DAYS = 30;

@Injectable()
export class TeacherSubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lazily expires a subscription whose period has ended, so status checks
   * always reflect reality without needing a separate cron sweep.
   */
  private async getEffectiveSubscription(userId: string) {
    const subscription = await this.prisma.teacherSubscription.findUnique({
      where: { userId },
    });
    if (!subscription) return null;

    if (
      subscription.status === TeacherSubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd <= new Date()
    ) {
      return this.prisma.teacherSubscription.update({
        where: { userId },
        data: { status: TeacherSubscriptionStatus.EXPIRED },
      });
    }

    return subscription;
  }

  async getMySubscription(userId: string) {
    const subscription = await this.getEffectiveSubscription(userId);
    return (
      subscription ?? {
        userId,
        status: TeacherSubscriptionStatus.PENDING_PAYMENT,
        monthlyFee: TEACHER_SUBSCRIPTION_MONTHLY_FEE,
        currentPeriodEnd: null,
        lastPaidAt: null,
      }
    );
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getEffectiveSubscription(userId);
    return subscription?.status === TeacherSubscriptionStatus.ACTIVE;
  }

  /**
   * Creates the subscription record (or resets an expired one) into
   * PENDING_PAYMENT, ready for the manual mark-as-paid step.
   */
  async startSubscription(userId: string) {
    const existing = await this.getEffectiveSubscription(userId);

    if (existing?.status === TeacherSubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already active');
    }

    return this.prisma.teacherSubscription.upsert({
      where: { userId },
      create: {
        userId,
        status: TeacherSubscriptionStatus.PENDING_PAYMENT,
        monthlyFee: TEACHER_SUBSCRIPTION_MONTHLY_FEE,
      },
      update: {
        status: TeacherSubscriptionStatus.PENDING_PAYMENT,
      },
    });
  }

  async markAsPaid(userId: string) {
    const subscription = await this.prisma.teacherSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not started yet');
    }

    if (subscription.status === TeacherSubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already active');
    }

    const now = new Date();

    return this.prisma.teacherSubscription.update({
      where: { userId },
      data: {
        status: TeacherSubscriptionStatus.ACTIVE,
        lastPaidAt: now,
        currentPeriodEnd: addDays(now, SUBSCRIPTION_PERIOD_DAYS),
      },
    });
  }
}
