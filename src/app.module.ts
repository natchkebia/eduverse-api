import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { CourseRequestsModule } from './course-requests/course-requests.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './contact/contact.module';
import { SiteReviewsModule } from './site-reviews/site-reviews.module';
import { TeacherSubscriptionsModule } from './teacher-subscriptions/teacher-subscriptions.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    CourseRequestsModule,
    DashboardModule,
    AdminModule,
    ChatModule,
    ContactModule,
    SiteReviewsModule,
    TeacherSubscriptionsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
