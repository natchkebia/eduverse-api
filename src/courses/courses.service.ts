import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { addDays, differenceInMinutes, subMinutes } from 'date-fns';

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

  async findBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        videos: true,
        materials: true,
      },
    });
  }

  async getExpiringCourses() {
    const localNow = new Date(); 
    
    const timezoneOffsetMinutes = localNow.getTimezoneOffset();
    const now = subMinutes(localNow, timezoneOffsetMinutes); 
    
    const maxHours = 24; 
    const maxMinutes = maxHours * 60;

    const potentialExpiringCourses = await this.prisma.course.findMany({
      where: {
        endDate: {
          gt: now,
        },
      },
      include: {
        videos: true,
        materials: true,
      },
    });

    const expiringCourses = potentialExpiringCourses.filter((course) => {
      if (!course.endDate) return false;
        
      const minutesLeft = differenceInMinutes(course.endDate, now); 

      return minutesLeft > 0 && minutesLeft <= maxMinutes;
    });
    
    return expiringCourses;
  }

  async createCourse(data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...data,
        startDate: new Date(), 
        endDate: addDays(new Date(), data.duration), 
        status: 'ACTIVE',
      },
    });
  }

  async extendCourse(id: number, duration: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.course.update({
      where: { id },
      data: {
        endDate: addDays(course.endDate ?? new Date(), duration),
        status: 'ACTIVE',
      },
    });
  }
}