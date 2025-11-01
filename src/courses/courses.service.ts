import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async findOneById(id: number) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async findOneBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        videos: true,
        materials: true,
      },
    });
  }
}
