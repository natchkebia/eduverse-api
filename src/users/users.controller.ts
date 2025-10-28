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
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ მიღება საკუთარი ტოკენით (dashboard-ში გამოსაყენებლად)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    return this.usersService.getMe(req.user.userId); // ტოკენიდან userId
  }

  // ✅ პაროლის ცვლილება
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userId = req.user.userId;

    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('ყველა ველი სავალდებულოა');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('მომხმარებელი ვერ მოიძებნა');

    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('ამჟამინდელი პაროლი არასწორია');
    }

    // ახალი პაროლის ჰეშვა
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: 'პაროლი წარმატებით შეიცვალა ✅' };
  }
}