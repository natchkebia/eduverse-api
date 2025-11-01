import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ყველა კურსის წამოღება
  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  // კონკრეტული კურსის წამოღება (slug ან id-ით)
  @Get(':identifier')
  async findOne(@Param('identifier') identifier: string) {
    // ✅ შევამოწმოთ, რიცხვია თუ არა (მაგ. /courses/1)
    const isNumeric = !isNaN(Number(identifier));

    const course = isNumeric
      ? await this.coursesService.findOneById(Number(identifier))
      : await this.coursesService.findOneBySlug(identifier);

    if (!course) {
      throw new NotFoundException(`Course not found for ${identifier}`);
    }

    return course;
  }
}
