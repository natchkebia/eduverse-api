import { Module } from '@nestjs/common';
import { CourseRequestsController } from './course-requests.controller';
import { CourseRequestsService } from './course-requests.service';
import { CloudinaryService } from './cloudinary.service';
import { TeacherSubscriptionsModule } from '../teacher-subscriptions/teacher-subscriptions.module';

@Module({
  imports: [TeacherSubscriptionsModule],
  controllers: [CourseRequestsController],
  providers: [CourseRequestsService, CloudinaryService],
  exports: [CloudinaryService, CourseRequestsService],
})
export class CourseRequestsModule {}
