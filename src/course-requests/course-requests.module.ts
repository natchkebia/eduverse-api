import { Module, forwardRef } from '@nestjs/common';
import { CourseRequestsController } from './course-requests.controller';
import { CourseRequestsService } from './course-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from './cloudinary.service';
// იმპორტი CoursesModule-ისთვის, თუ საჭიროა
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    PrismaModule,
    // თუ CoursesModule-იც აიმპორტებს ამ მოდულს, გამოიყენე forwardRef
    forwardRef(() => CoursesModule), 
  ],
  controllers: [CourseRequestsController],
  providers: [
    CourseRequestsService, 
    CloudinaryService 
  ],
  exports: [CloudinaryService] // ✅ სხვა მოდულებისთვის ხელმისაწვდომია
})
export class CourseRequestsModule {}