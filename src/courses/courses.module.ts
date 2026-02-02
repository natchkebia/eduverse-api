import { Module, forwardRef } from '@nestjs/common'; // ✅ დაამატე forwardRef აქ
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaModule } from '../prisma/prisma.module'; 
import { CourseRequestsModule } from '../course-requests/course-requests.module';

@Module({
  imports: [
    PrismaModule, 
    forwardRef(() => CourseRequestsModule)
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}