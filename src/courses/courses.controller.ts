import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Post,
  Body,
  Patch,
  UseGuards, 
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ExtendCourseDto } from './dto/extend-course.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { RolesGuard } from '../auth/roles.guard'; 
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client'; 

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}


  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get('expiring')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) 
  async getExpiringCourses() {
    return this.coursesService.getExpiringCourses();
  }

  @Get('id/:id')
  async findOneById(@Param('id') id: string) {
    const course = await this.coursesService.findOneById(Number(id));
    if (!course) throw new NotFoundException(`Course not found for id ${id}`);
    return course;
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const course = await this.coursesService.findBySlug(slug);
    if (!course)
      throw new NotFoundException(`Course not found for slug ${slug}`);
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
  async extendCourse(@Param('id') id: string, @Body() body: ExtendCourseDto) {
    return this.coursesService.extendCourse(Number(id), body.duration);
  }
}
