import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CourseRequestsService } from '../course-requests/course-requests.service';
import { CoursesService } from '../courses/courses.service';
import { AdminUpdateRequestDto } from '../course-requests/dto/admin-update-request.dto';
import { UpdateCourseDto } from '../courses/dto/update-course.dto';
import { ExtendCourseDto } from '../courses/dto/extend-course.dto';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly courseRequestsService: CourseRequestsService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('courses')
  getCourses() {
    return this.adminService.getCourses();
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(Number(id), dto);
  }

  @Patch('courses/:id/extend')
  extendCourse(@Param('id') id: string, @Body() dto: ExtendCourseDto) {
    return this.coursesService.extendCourse(Number(id), dto.duration);
  }

  @Patch('courses/:id/archive')
  archiveCourse(@Param('id') id: string) {
    return this.coursesService.updateCourse(Number(id), {
      status: 'ARCHIVED' as any,
    });
  }

  @Get('course-listing-requests/pending')
  getPendingListingRequests() {
    return this.coursesService.getPendingListingRequests();
  }

  @Post('course-listing-requests/:id/approve')
  approveListingRequest(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.coursesService.approveListingRequest(id, req.user.id);
  }

  @Post('course-listing-requests/:id/reject')
  rejectListingRequest(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.coursesService.rejectListingRequest(id, req.user.id);
  }

  @Get('course-requests/pending')
  getPendingCourseRequests() {
    return this.courseRequestsService.getPendingRequests();
  }

  @Patch('course-requests/:id')
  updateCourseRequest(
    @Param('id') id: string,
    @Body() dto: AdminUpdateRequestDto,
  ) {
    return this.courseRequestsService.adminUpdateRequest(id, dto);
  }

  @Post('course-requests/:id/approve')
  approveCourseRequest(@Param('id') id: string) {
    return this.courseRequestsService.approve(id);
  }

  @Post('course-requests/:id/reject')
  rejectCourseRequest(@Param('id') id: string) {
    return this.courseRequestsService.reject(id);
  }

  @Get('orders')
  getOrders() {
    return this.adminService.getOrders();
  }

  @Get('analytics/summary')
  getAnalyticsSummary() {
    return this.adminService.getAnalyticsSummary();
  }
}
