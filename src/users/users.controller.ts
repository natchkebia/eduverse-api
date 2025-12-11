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

import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ⭐ ADMIN ONLY — Get full users list
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  // ⭐ Get logged-in user
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    return this.usersService.getMe(req.user.id);
  }

  // ⭐ Change password
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userId = req.user.id;

    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('ყველა ველი სავალდებულოა');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('მომხმარებელი ვერ მოიძებნა');

    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('ამჟამინდელი პაროლი არასწორია');
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: 'პაროლი წარმატებით შეიცვალა ✅' };
  }
}
