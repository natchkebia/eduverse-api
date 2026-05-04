import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Register ───────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
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
    const verificationTokenHash = this.hashToken(verificationToken);

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
        verificationToken: verificationTokenHash,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.emailService.sendVerificationEmail(email, verificationToken);
    return { success: true };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
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
    const verificationTokenHash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: verificationTokenHash,
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
    const resetTokenHash = this.hashToken(token);

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await this.emailService.sendPasswordResetEmail(email, token);
    return { success: true };
  }

  // ─── Reset password ─────────────────────────────────────────────────────────
  async resetPassword(token: string, password: string) {
    const resetTokenHash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: resetTokenHash,
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
