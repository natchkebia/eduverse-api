import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('teacher-subscription/checkout')
  @UseGuards(JwtAuthGuard)
  createSubscriptionCheckout(@Req() req: AuthenticatedRequest) {
    return this.payments.createSubscriptionCheckout(req.user.id);
  }

  @Post('courses/:courseId/checkout')
  @UseGuards(JwtAuthGuard)
  createCourseCheckout(
    @Req() req: AuthenticatedRequest,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.payments.createCourseCheckout(req.user.id, courseId);
  }

  /**
   * Server-to-server callback from Flitt. Public (no auth) but authenticated
   * by signature inside the service. No DTO — keep the raw fields intact.
   */
  @Post('flitt/callback')
  @HttpCode(200)
  async flittCallback(@Body() body: Record<string, any>) {
    await this.payments.handleCallback(body);
    return { status: 'ok' };
  }

  @Get(':orderId/status')
  @UseGuards(JwtAuthGuard)
  getStatus(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.getStatus(req.user.id, orderId);
  }
}
