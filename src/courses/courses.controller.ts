import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}


  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }


  @Get('id/:id')
  async findOneById(@Param('id') id: string) {
    const course = await this.coursesService.findOneById(Number(id));

    if (!course) throw new NotFoundException(`Course not found for id ${id}`);

    return course;
  }

  // ⭐ GET /courses/slug/frontend-development → წამოიღებს SLUG-ით
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const course = await this.coursesService.findBySlug(slug);

    if (!course) throw new NotFoundException(`Course not found for slug ${slug}`);

    return course;
  }
}
