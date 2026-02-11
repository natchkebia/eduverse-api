import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CourseRequestsService } from './course-requests.service';
import { CloudinaryService } from './cloudinary.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

import { CreateCourseRequestDto } from './dto/create-course-request.dto';
import { SetListingDto } from './dto/set-listing.dto'; // ✅ სწორი dto

@Controller('course-requests')
export class CourseRequestsController {
  constructor(
    private readonly service: CourseRequestsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ✅ Cloudinary ხელმოწერის აღება (ფოტო ატვირთვისთვის აუცილებელია)
  @Get('upload-signature')
  @UseGuards(JwtAuthGuard)
  getSignature() {
    return this.cloudinaryService.getUploadSignature();
  }

  // ✅ ადმინის მიერ request-ის რედაქტირება
  @Patch('admin/:id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminEdit(@Param('id') id: string, @Body() dto: any) {
    return this.service.adminUpdateRequest(id, dto);
  }

  // ✅ ახალი დრაფტის შექმნა
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateCourseRequestDto) {
    return this.service.createDraft(req.user.id, dto);
  }

  // ✅ FRONT: /details route თუ გაქვს გამოყენებაში — დავტოვოთ, რომ არ გაგიტყდეს
  @Patch(':id/details')
  @UseGuards(JwtAuthGuard)
  updateDetails(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCourseRequestDto>,
  ) {
    return this.service.updateDraft(id, req.user.id, dto);
  }

  // ✅ სტანდარტული update
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCourseRequestDto>,
  ) {
    return this.service.updateDraft(id, req.user.id, dto);
  }

  // ✅ listing days დაყენება (ეს არის შენი ახალი ლოგიკა)
  @Patch(':id/listing')
  @UseGuards(JwtAuthGuard)
  setListing(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetListingDto,
  ) {
    return this.service.setListing(id, req.user.id, dto.listingDays);
  }

  // ✅ გადახდის სტატუსის მონიშვნა
  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard)
  pay(@Req() req: any, @Param('id') id: string) {
    return this.service.markAsPaid(id, req.user.id);
  }

  // ✅ განსახილველად გაგზავნა
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  submit(@Req() req: any, @Param('id') id: string) {
    return this.service.submitForApproval(id, req.user.id, req.user?.role);
  }

  // ✅ ადმინისთვის pending list (ძველი path დავტოვოთ)
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  pending() {
    return this.service.getPendingRequests();
  }

  // ✅ approve
  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  // ✅ reject
  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
