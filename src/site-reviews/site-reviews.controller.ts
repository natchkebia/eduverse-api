import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpsertSiteReviewDto } from './dto/upsert-site-review.dto';
import { UpdateSiteReviewPublicationDto } from './dto/update-site-review-publication.dto';
import { SiteReviewsService } from './site-reviews.service';

@Controller('site-reviews')
export class SiteReviewsController {
  constructor(private readonly siteReviewsService: SiteReviewsService) {}

  @Get()
  getPublishedReviews(@Query('limit') limit?: string) {
    return this.siteReviewsService.getPublishedReviews(
      limit ? Number(limit) : undefined,
    );
  }

  @Get('upload-signature')
  @UseGuards(JwtAuthGuard)
  getUploadSignature() {
    return this.siteReviewsService.getUploadSignature();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyReview(@Req() req: AuthenticatedRequest) {
    return this.siteReviewsService.getMyReview(req.user.id);
  }

  @Post('my')
  @UseGuards(JwtAuthGuard)
  upsertMyReview(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertSiteReviewDto,
  ) {
    return this.siteReviewsService.upsertMyReview(req.user.id, dto);
  }

  @Delete('my')
  @UseGuards(JwtAuthGuard)
  deleteMyReview(@Req() req: AuthenticatedRequest) {
    return this.siteReviewsService.deleteMyReview(req.user.id);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllReviews() {
    return this.siteReviewsService.getAllReviews();
  }

  @Patch('admin/:id/publication')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updatePublication(
    @Param('id') id: string,
    @Body() dto: UpdateSiteReviewPublicationDto,
  ) {
    return this.siteReviewsService.updatePublication(id, dto.published);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteReview(@Param('id') id: string) {
    return this.siteReviewsService.deleteReview(id);
  }
}
