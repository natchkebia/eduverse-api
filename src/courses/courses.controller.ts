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

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, CourseType, CourseStatus } from '@prisma/client';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── Public endpoints ───────────────────────────────────────────────────────

  @Get()
  async getCourses(
    @Query('type') type?: CourseType,
    @Query('locale') locale: string = 'ka',
  ) {
    return this.coursesService.getPublicCourses(type, locale);
  }

  @Get('public')
  getPublicCourses(
    @Query('type') type?: CourseType,
    @Query('locale') locale: string = 'ka',
  ) {
    return this.coursesService.getPublicCourses(type, locale);
  }

  @Get('active')
  async getActiveCourses() {
    return this.coursesService.getActiveCourses();
  }

  @Get('search')
  async searchCourses(
    @Query('query') query: string,
    @Query('locale') locale: string = 'ka',
  ) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.coursesService.searchCourses(query, locale);
  }

  // ─── Authenticated user endpoints ───────────────────────────────────────────

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyCourses(@Req() req: any, @Query('status') status?: CourseStatus) {
    return this.coursesService.getMyCourses(req.user.id, status);
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
  async adminEditCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
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

  // ─── Single course lookup ────────────────────────────────────────────────────

  @Get('id/:id')
  async findOneById(@Param('id') id: string) {
    const course = await this.coursesService.findOneById(Number(id));
    if (!course) {
      throw new NotFoundException(`Course not found for id ${id}`);
    }
    return course;
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const course = await this.coursesService.findBySlug(slug);
    if (!course) {
      throw new NotFoundException(`Course not found for slug ${slug}`);
    }
    return course;
  }
}