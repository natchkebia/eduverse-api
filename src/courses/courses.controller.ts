import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Post,
  Body,
  Patch,
  UseGuards,
  Query,
  Req,
  Delete,
} from '@nestjs/common';

import { CoursesService } from './courses.service';
import { CloudinaryService } from '../course-requests/cloudinary.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ExtendCourseDto } from './dto/extend-course.dto';
import { RateCourseDto } from './dto/rate-course.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, CourseType, CourseStatus } from '@prisma/client';
import {
  AuthenticatedRequest,
  OptionalAuthenticatedRequest,
} from '../auth/types/authenticated-request.type';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── Public endpoints ───────────────────────────────────────────────────────

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getCourses(
    @Query('type') type?: CourseType,
    @Query('locale') locale: string = 'ka',
    @Req() req?: OptionalAuthenticatedRequest,
  ) {
    return this.coursesService.getPublicCourses(type, locale, req?.user?.id);
  }

  @Get('public')
  @UseGuards(OptionalJwtAuthGuard)
  getPublicCourses(
    @Query('type') type?: CourseType,
    @Query('locale') locale: string = 'ka',
    @Req() req?: OptionalAuthenticatedRequest,
  ) {
    return this.coursesService.getPublicCourses(type, locale, req?.user?.id);
  }

  @Get('active')
  @UseGuards(OptionalJwtAuthGuard)
  async getActiveCourses(@Req() req?: OptionalAuthenticatedRequest) {
    return this.coursesService.getActiveCourses(req?.user?.id);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  async searchCourses(
    @Query('query') query: string,
    @Query('locale') locale: string = 'ka',
    @Req() req?: OptionalAuthenticatedRequest,
  ) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.coursesService.searchCourses(query, locale, req?.user?.id);
  }

  // ─── Authenticated user endpoints ───────────────────────────────────────────

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyCourses(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: CourseStatus,
  ) {
    return this.coursesService.getMyCourses(req.user.id, status);
  }

  @Patch(':id/max-students')
  @UseGuards(JwtAuthGuard)
  async updateOwnMaxStudents(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { maxStudents?: number },
  ) {
    return this.coursesService.updateOwnMaxStudents(
      Number(id),
      req.user.id,
      Number(body.maxStudents),
    );
  }

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  @Get('admin/expiring')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getExpiringCourses() {
    return this.coursesService.getExpiringCourses();
  }

  @Get('admin/archived')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getArchivedCourses() {
    return this.coursesService.getArchivedCourses();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCourse(@Body() body: CreateCourseDto) {
    return this.coursesService.createCourse(body);
  }

  @Patch('admin/:id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminEditCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(Number(id), dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(Number(id));
  }

  @Patch('admin/:id/remove-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeCourseImage(@Param('id') id: string) {
    const course = await this.coursesService.findOneById(Number(id));
    if (!course) {
      throw new NotFoundException('კურსი ვერ მოიძებნა');
    }
    if (course.imageUrl) {
      await this.cloudinaryService.deleteImage(course.imageUrl);
      return this.coursesService.updateCourseImage(Number(id), null);
    }
    return { message: 'სურათი უკვე წაშლილია' };
  }

  @Patch('extend/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async extendCourse(@Param('id') id: string, @Body() body: ExtendCourseDto) {
    return this.coursesService.extendCourse(Number(id), body.duration);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollInCourse(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.coursesService.enrollInCourse(Number(id), req.user.id);
  }

  @Post(':id/rating')
  @UseGuards(JwtAuthGuard)
  async rateCourse(
    @Param('id') id: string,
    @Body() dto: RateCourseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.coursesService.rateCourse(Number(id), req.user.id, dto.rating);
  }

  // ─── Single course lookup ────────────────────────────────────────────────────

  @Get('id/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOneById(
    @Param('id') id: string,
    @Req() req?: OptionalAuthenticatedRequest,
  ) {
    const course = await this.coursesService.findOneById(
      Number(id),
      req?.user?.id,
    );
    if (!course) {
      throw new NotFoundException(`Course not found for id ${id}`);
    }
    return course;
  }

  @Get('slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findBySlug(
    @Param('slug') slug: string,
    @Req() req?: OptionalAuthenticatedRequest,
  ) {
    const course = await this.coursesService.findBySlug(slug, req?.user?.id);
    if (!course) {
      throw new NotFoundException(`Course not found for slug ${slug}`);
    }
    return course;
  }
}
