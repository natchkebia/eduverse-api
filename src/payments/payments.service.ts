import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  CourseType,
  Payment,
  PaymentPurpose,
  PaymentStatus,
  TeacherSubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FlittService, FlittError } from './flitt.service';
import {
  TeacherSubscriptionsService,
  TEACHER_SUBSCRIPTION_MONTHLY_FEE,
} from '../teacher-subscriptions/teacher-subscriptions.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly flitt: FlittService,
    private readonly subscriptions: TeacherSubscriptionsService,
    private readonly courses: CoursesService,
  ) {}

  private get frontendUrl(): string {
    return this.config
      .get<string>('FRONTEND_URL', 'http://localhost:3001')
      .split(',')[0]
      .trim();
  }

  private get backendUrl(): string {
    return this.config.get<string>('BACKEND_URL', 'http://localhost:3000');
  }

  private callbackUrl(): string {
    return `${this.backendUrl}/payments/flitt/callback`;
  }

  private responseUrl(orderId: string): string {
    return `${this.frontendUrl}/payment/result?order=${encodeURIComponent(orderId)}`;
  }

  /** Fail fast with a clear message when Flitt credentials are missing. */
  private ensureConfigured(): void {
    const merchant = this.config.get<string>('FLITT_MERCHANT_ID');
    const secret = this.config.get<string>('FLITT_SECRET_KEY');
    if (!merchant || !secret) {
      throw new ServiceUnavailableException(
        'გადახდის სისტემა არ არის კონფიგურირებული',
      );
    }
  }

  /** Run a checkout request, mapping Flitt failures to a clean 502 + reason. */
  private async checkout(input: Parameters<FlittService['createCheckout']>[0]) {
    try {
      return await this.flitt.createCheckout(input);
    } catch (e) {
      if (e instanceof FlittError) {
        throw new BadGatewayException(e.message);
      }
      throw e;
    }
  }

  // ─── Teacher subscription (30₾/month) ──────────────────────────────────────
  async createSubscriptionCheckout(userId: string) {
    this.ensureConfigured();

    const current = await this.subscriptions.getMySubscription(userId);
    if (current.status === TeacherSubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is already active');
    }

    // ensure a PENDING_PAYMENT record exists
    await this.subscriptions.startSubscription(userId);

    const feeGel = current.monthlyFee ?? TEACHER_SUBSCRIPTION_MONTHLY_FEE;
    const amount = feeGel * 100; // tetri
    const orderId = `sub_${userId}_${crypto.randomUUID()}`;

    await this.prisma.payment.create({
      data: {
        orderId,
        purpose: PaymentPurpose.TEACHER_SUBSCRIPTION,
        amount,
        currency: 'GEL',
        userId,
      },
    });

    const checkoutUrl = await this.checkout({
      orderId,
      amount,
      currency: 'GEL',
      description: 'Eduverse teacher subscription (1 month)',
      callbackUrl: this.callbackUrl(),
      responseUrl: this.responseUrl(orderId),
    });

    return { checkoutUrl, orderId };
  }

  // ─── Course enrollment (one-time) ──────────────────────────────────────────
  async createCourseCheckout(userId: string, courseId: number) {
    this.ensureConfigured();

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        type: true,
        originalPrice: true,
        discountedPrice: true,
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('You are already registered');

    const priceGel =
      course.type === CourseType.COURSE
        ? (course.discountedPrice ?? course.originalPrice ?? 0)
        : 0;

    // free course / non-paid type → enroll immediately, no payment needed
    if (priceGel <= 0) {
      await this.courses.enrollInCourse(courseId, userId);
      return { free: true as const };
    }

    const amount = priceGel * 100; // tetri
    const orderId = `course_${courseId}_${userId}_${crypto.randomUUID()}`;

    await this.prisma.payment.create({
      data: {
        orderId,
        purpose: PaymentPurpose.COURSE_ENROLLMENT,
        amount,
        currency: 'GEL',
        userId,
        courseId,
      },
    });

    const checkoutUrl = await this.checkout({
      orderId,
      amount,
      currency: 'GEL',
      description: `Eduverse course #${courseId}`,
      callbackUrl: this.callbackUrl(),
      responseUrl: this.responseUrl(orderId),
    });

    return { checkoutUrl, orderId };
  }

  // ─── Server-to-server callback from Flitt ──────────────────────────────────
  async handleCallback(body: Record<string, any>): Promise<void> {
    if (!this.flitt.verifyCallback(body)) {
      this.logger.warn('Rejected Flitt callback with invalid signature');
      throw new BadRequestException('Invalid signature');
    }

    const orderId = String(body.order_id ?? '');
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) {
      this.logger.warn(`Callback for unknown order ${orderId}`);
      return; // unknown order — nothing to do
    }
    if (payment.status === PaymentStatus.APPROVED) {
      return; // already fulfilled — idempotent
    }

    const orderStatus = String(body.order_status ?? '');
    const flittPaymentId = body.payment_id ? String(body.payment_id) : null;

    if (orderStatus === 'approved') {
      await this.prisma.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.APPROVED,
          paidAt: new Date(),
          flittPaymentId,
          rawCallback: body,
        },
      });
      await this.fulfill(payment);
    } else if (orderStatus === 'declined') {
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: PaymentStatus.DECLINED, rawCallback: body },
      });
    } else if (orderStatus === 'expired' || orderStatus === 'reversed') {
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: PaymentStatus.EXPIRED, rawCallback: body },
      });
    } else {
      // processing / created — keep PENDING, just store the latest payload
      await this.prisma.payment.update({
        where: { orderId },
        data: { rawCallback: body },
      });
    }
  }

  /** Grant whatever the payment was for. Idempotent against duplicate callbacks. */
  private async fulfill(payment: Payment): Promise<void> {
    try {
      if (payment.purpose === PaymentPurpose.TEACHER_SUBSCRIPTION) {
        await this.subscriptions.markAsPaid(payment.userId);
      } else if (
        payment.purpose === PaymentPurpose.COURSE_ENROLLMENT &&
        payment.courseId
      ) {
        await this.courses.enrollInCourse(payment.courseId, payment.userId);
      }
    } catch (error) {
      // Already-active subscription or already-enrolled course are benign on
      // a retried callback; anything else we log but don't fail the callback,
      // otherwise Flitt keeps retrying a payment we've already recorded.
      this.logger.warn(
        `Fulfillment for order ${payment.orderId} reported: ${
          (error as Error).message
        }`,
      );
    }
  }

  // ─── Status polling (frontend result page) ─────────────────────────────────
  async getStatus(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, userId },
      select: { orderId: true, status: true, purpose: true, paidAt: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
