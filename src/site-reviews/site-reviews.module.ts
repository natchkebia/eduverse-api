import { Module } from '@nestjs/common';
import { CloudinaryService } from '../course-requests/cloudinary.service';
import { SiteReviewsController } from './site-reviews.controller';
import { SiteReviewsService } from './site-reviews.service';

@Module({
  controllers: [SiteReviewsController],
  providers: [SiteReviewsService, CloudinaryService],
  exports: [SiteReviewsService],
})
export class SiteReviewsModule {}
