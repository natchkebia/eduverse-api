import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-reset.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { OAuthRequest } from './types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    const user = await this.authService.validateOAuthUser(req.user);
    const token = this.authService.createOAuthToken(user);
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    return res.redirect(
      `${frontendUrl}/ka/oauth?token=${encodeURIComponent(token)}`,
    );
  }

  // ─── Facebook OAuth ────────────────────────────────────────────────────────
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin() {}

  @Get('facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    const user = await this.authService.validateOAuthUser(req.user);
    const token = this.authService.createOAuthToken(user);
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    return res.redirect(
      `${frontendUrl}/oauth?token=${encodeURIComponent(token)}`,
    );
  }
}
