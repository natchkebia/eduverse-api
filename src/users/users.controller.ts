import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  surname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

class ChangePasswordDto {
  @IsString()
  @MaxLength(72)
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(72)
  newPassword: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── ADMIN: full user list ─────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/age-analytics')
  async getAgeAnalytics() {
    return this.usersService.getAgeAnalytics();
  }

  // ─── Authenticated user: get own profile ───────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    return this.usersService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req, @Body() body: UpdateProfileDto) {
    return this.usersService.updateMe(req.user.id, body);
  }

  // ─── Authenticated user: change password ───────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Req() req, @Body() body: ChangePasswordDto) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('ყველა ველი სავალდებულოა');
    }
    return this.usersService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }
}
