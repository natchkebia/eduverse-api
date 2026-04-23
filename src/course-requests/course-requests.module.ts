import { Module } from '@nestjs/common';
import { CourseRequestsController } from './course-requests.controller';
import { CourseRequestsService } from './course-requests.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  controllers: [CourseRequestsController],
  providers: [CourseRequestsService, CloudinaryService],
  exports: [CloudinaryService],
})
export class CourseRequestsModule {}