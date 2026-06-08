import { Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { TeacherSubscriptionsService } from './teacher-subscriptions.service';

@Controller('teacher-subscriptions')
export class TeacherSubscriptionsController {
  constructor(private readonly service: TeacherSubscriptionsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  my(@Req() req: AuthenticatedRequest) {
    return this.service.getMySubscription(req.user.id);
  }

  @Post('start')
  @UseGuards(JwtAuthGuard)
  start(@Req() req: AuthenticatedRequest) {
    return this.service.startSubscription(req.user.id);
  }

  @Patch('pay')
  @UseGuards(JwtAuthGuard)
  pay(@Req() req: AuthenticatedRequest) {
    return this.service.markAsPaid(req.user.id);
  }
}
