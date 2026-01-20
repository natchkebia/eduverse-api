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
} from '@nestjs/common';

import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ExtendCourseDto } from './dto/extend-course.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, CourseType } from '@prisma/client';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * ✅ ROOT ENDPOINT
   * Supports:
   *  - /courses?type=COURSE&locale=ka
   *  - /courses?type=WORKSHOP&locale=en
   */
  @Get()
  async getCourses(
    @Query('type') type?: CourseType,
    @Query('locale') locale: string = 'ka',
  ) {
    return this.coursesService.getPublicCourses(type, locale);
  }

  /**
   * 🔍 SEARCH
   * /courses/search?query=react&locale=en
   */
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

  /**
   * 🌍 PUBLIC COURSES
   * /courses/public?type=COURSE&locale=en
   */
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

  /**
   * 🔐 ADMIN
   */
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

  /**
   * 📄 SINGLE COURSE
   */
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

  /**
   * ✍️ CREATE / EXTEND (ADMIN ONLY)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCourse(@Body() body: CreateCourseDto) {
    return this.coursesService.createCourse(body);
  }

  @Patch('extend/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async extendCourse(
    @Param('id') id: string,
    @Body() body: ExtendCourseDto,
  ) {
    return this.coursesService.extendCourse(Number(id), body.duration);
  }
}
