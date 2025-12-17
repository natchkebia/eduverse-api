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
  
  @Get('public')
  getPublicCourses(@Query('type') type?: CourseType) {
    return this.coursesService.getPublicCourses(type);
  }

  @Get('active')
  async getActiveCourses() {
    return this.coursesService.getActiveCourses();
  }

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
