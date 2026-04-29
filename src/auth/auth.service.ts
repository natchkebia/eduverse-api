import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import { Resend } from 'resend';

@Injectable()
export class AuthService implements OnModuleInit {
  private resend: Resend;
  private frontendUrl: string;
  private emailFrom: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('⚠️  RESEND_API_KEY is not set — email sending will fail.');
      this.resend = null as any;
    } else {
      this.resend = new Resend(resendApiKey);
    }
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    this.emailFrom = this.configService.get<string>('EMAIL_FROM', 'noreply@eduverse.dev');
  }

  // ─── Register ───────────────────────────────────────────────────────────────
  async register(
    dto: {
      email: string;
      password: string;
      name: string;
      surname?: string;
      phone?: string;
      dateOfBirth: string;
    },
  ) {
    const { email, password, name, surname, phone, dateOfBirth } = dto;
    const dob = dateOfBirth ? new Date(dateOfBirth) : null;
    if (!dob || Number.isNaN(dob.getTime())) {
      throw new BadRequestException('dateOfBirth is required');
    }

    const age = this.getAgeFromDob(dob);
    if (age < 13 || age > 80) {
      throw new BadRequestException('Age must be between 13 and 80');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    });
    if (existingUser) {
      throw new ConflictException(
        'ამ ელფოსტით ან ნომრით მომხმარებელი უკვე არსებობს!',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname: surname ?? null,
        phone: phone ?? null,
        dateOfBirth: dob,
        role: Role.STUDENT,
        provider: 'local',
        verified: false,
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.sendVerificationEmail(email, verificationToken);
    return { success: true };
  }

  private getAgeFromDob(dob: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    const dayDiff = now.getDate() - dob.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }

  private async sendVerificationEmail(email: string, token: string) {
    if (!this.resend) {
      console.warn('⚠️  Skipping verification email because Resend is not configured.');
      return;
    }
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    try {
      await this.resend.emails.send({
        from: this.emailFrom,
        to: email,
        subject: 'Confirm your email — EduVerse',
        html: `
          <h3>Welcome to EduVerse!</h3>
          <p>დაადასტურე შენი ელფოსტა რომ გააგრძელო:</p>
          <a href="${verifyUrl}">${verifyUrl}</a>
        `,
      });
    } catch (err) {
      console.error('Failed to send verification email:', err);
      // Do not throw — user is created, email failure is non-fatal in dev
    }
  }

  // ─── Login ──────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new UnauthorizedException('ელფოსტა ან პაროლი არასწორია');
    }

    if (user.provider === 'local' && !user.verified) {
      throw new UnauthorizedException(
        'გთხოვთ დაადასტუროთ ელფოსტა და შემდეგ გაიაროთ ავტორიზაცია.',
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('ელფოსტა ან პაროლი არასწორია');
    }

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken: token };
  }

  // ─── Verify email ───────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token invalid or expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return { success: true };
  }

  // ─── Forgot password ────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent user enumeration
    if (!user || user.provider !== 'local') {
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await this.sendPasswordResetEmail(email, token);
    return { success: true };
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    if (!this.resend) {
      console.warn('⚠️  Skipping password reset email because Resend is not configured.');
      return;
    }
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;
    try {
      await this.resend.emails.send({
        from: this.emailFrom,
        to: email,
        subject: 'Reset your password — EduVerse',
        html: `
          <h3>Password Reset</h3>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}">${resetLink}</a>
        `,
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }
  }

  // ─── Reset password ─────────────────────────────────────────────────────────
  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('ტოკენი არასწორია ან ვადაგასულია');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { success: true };
  }

  // ─── OAuth ──────────────────────────────────────────────────────────────────
  async validateOAuthUser(oauthUser: {
    email: string;
    name: string;
    surname?: string | null;
    avatar?: string | null;
    provider: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (!existing) {
      return this.prisma.user.create({
        data: {
          email: oauthUser.email,
          password: null,
          name: oauthUser.name,
          surname: oauthUser.surname ?? null,
          avatar: oauthUser.avatar ?? null,
          provider: oauthUser.provider,
          verified: true,
          role: Role.STUDENT,
        },
      });
    }

    return this.prisma.user.update({
      where: { id: existing.id },
      data: {
        provider: oauthUser.provider,
        avatar: oauthUser.avatar ?? existing.avatar,
        verified: true,
      },
    });
  }

  createOAuthToken(user: { id: string; email: string; role: Role }) {
    return this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
