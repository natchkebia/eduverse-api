import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseRequestsModule } from '../course-requests/course-requests.module';

@Module({
  imports: [CourseRequestsModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}