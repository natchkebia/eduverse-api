// src/courses/courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 აუცილებელია აქ ჩასმა

@Module({
  imports: [PrismaModule], // 👈 დაამატე
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
