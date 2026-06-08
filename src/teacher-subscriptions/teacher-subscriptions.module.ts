import { Module } from '@nestjs/common';
import { TeacherSubscriptionsController } from './teacher-subscriptions.controller';
import { TeacherSubscriptionsService } from './teacher-subscriptions.service';

@Module({
  controllers: [TeacherSubscriptionsController],
  providers: [TeacherSubscriptionsService],
  exports: [TeacherSubscriptionsService],
})
export class TeacherSubscriptionsModule {}
