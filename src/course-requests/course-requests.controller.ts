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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateCourseRequestDto } from './dto/create-course-request.dto';
import { SetListingDto } from './dto/set-course-request-details.dto';

@Controller('course-requests')
export class CourseRequestsController {
  constructor(private readonly service: CourseRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateCourseRequestDto) {
    return this.service.createDraft(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCourseRequestDto>,
  ) {
    return this.service.updateDraft(id, req.user.id, dto);
  }

  @Patch(':id/listing')
  @UseGuards(JwtAuthGuard)
  setListing(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetListingDto,
  ) {
    return this.service.setListing(id, req.user.id, dto.listingDays);
  }

  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard)
  pay(@Req() req: any, @Param('id') id: string) {
    return this.service.markAsPaid(id, req.user.id);
  }

  // ✅ submit: USER -> PENDING_APPROVAL, ADMIN -> auto approve + publish
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  submit(@Req() req: any, @Param('id') id: string) {
    return this.service.submitForApproval(id, req.user.id, req.user.role);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  pending() {
    return this.service.getPendingRequests();
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
