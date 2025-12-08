import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async register(
    email: string,
    password: string,
    name: string,
    surname?: string,
    phone?: string,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      throw new ConflictException(
        'ამ ელფოსტით ან ნომრით მომხმარებელი უკვე არსებობს!',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname: surname || null,
        phone: phone || null,
        role: Role.STUDENT,
        provider: 'local',
        verified: false,
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const verifyUrl = `${process.env.NEXT_PUBLIC_URL}/verify-email?token=${verificationToken}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Confirm your email',
      html: `
        <h3>Welcome to Eduverse!</h3>
        <p>დაადასტურე შენი ელფოსტა რომ გააგრძელო:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
    });
    return { success: true };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new UnauthorizedException('მომხმარებელი ვერ მოიძებნა');
    if (user.provider === 'local' && !user.verified) {
      throw new UnauthorizedException(
        'გთხოვთ დაადასტუროთ ელფოსტა და შემდეგ გაიაროთ ავტორიზაცია.',
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('პაროლი არასწორია');

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return { accessToken: token };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const resetLink = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset your password',
      html: `
        <h3>Password reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    return { success: true };
  }


  async resetPassword(token: string, password: string) {
    if (!token || !password) {
      throw new BadRequestException('ტოკენი და პაროლი სავალდებულოა');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('ტოკენი არასწორია ან ვადაგასულია');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

  async validateOAuthUser(oauthUser: any) {
    const existing = await this.prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (!existing) {
      return this.prisma.user.create({
        data: {
          email: oauthUser.email,
          password: null,
          name: oauthUser.name,
          surname: oauthUser.surname || null,
          avatar: oauthUser.avatar || null,
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
        avatar: oauthUser.avatar || existing.avatar,
        verified: true,
      },
    });
  }

  createOAuthToken(user: any) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
  }
}
