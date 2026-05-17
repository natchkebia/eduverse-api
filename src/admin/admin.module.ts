import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CourseRequestsModule } from '../course-requests/course-requests.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [CourseRequestsModule, CoursesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
