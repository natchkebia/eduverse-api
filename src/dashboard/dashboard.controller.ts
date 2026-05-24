import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('purchased-courses')
  getPurchasedCourses(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getPurchasedCourses(req.user.id);
  }

  @Get('created-courses')
  getCreatedCourses(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getCreatedCourses(req.user.id);
  }

  @Get('course-listing-notices')
  getCourseListingNotices(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getCourseListingNotices(req.user.id);
  }

  @Get('course-requests')
  getCourseRequests(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getCourseRequests(req.user.id);
  }

  @Get('summary')
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getSummary(req.user.id);
  }
}
