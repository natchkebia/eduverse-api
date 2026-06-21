import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlittService } from './flitt.service';
import { TeacherSubscriptionsModule } from '../teacher-subscriptions/teacher-subscriptions.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [TeacherSubscriptionsModule, CoursesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, FlittService],
})
export class PaymentsModule {}
