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
import { SetCourseRequestDetailsDto } from './dto/set-course-request-details.dto';

@Controller('course-requests')
export class CourseRequestsController {
  constructor(private readonly service: CourseRequestsService) {}

  // USER — create draft
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateCourseRequestDto) {
    return this.service.createDraft(req.user.id, dto);
  }

  // USER — set days & price
  @Patch(':id/details')
  @UseGuards(JwtAuthGuard)
  setDetails(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetCourseRequestDetailsDto,
  ) {
    return this.service.setDetails(id, req.user.id, dto.days, dto.price);
  }

  // USER — fake payment
  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard)
  pay(@Req() req: any, @Param('id') id: string) {
    return this.service.markAsPaid(id, req.user.id);
  }

  // USER — submit to admin
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  submit(@Req() req: any, @Param('id') id: string) {
    return this.service.submitForApproval(id, req.user.id);
  }

  // ADMIN — list pending
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  pending() {
    return this.service.getPendingRequests();
  }

  // ADMIN — approve
  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  // ADMIN — reject
  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
