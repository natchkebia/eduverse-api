import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
      },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Validates current password and updates to new password.
   * Business logic lives here — not in the controller.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('მომხმარებელი ვერ მოიძებნა');

    if (!user.password) {
      throw new BadRequestException(
        'ამ ანგარიშს პაროლი არ აქვს — გამოიყენეთ OAuth შესვლა',
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('ამჟამინდელი პაროლი არასწორია');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.updatePassword(userId, hashed);

    return { message: 'პაროლი წარმატებით შეიცვალა ✅' };
  }

  async getAgeAnalytics() {
    const users = await this.prisma.user.findMany({
      where: { dateOfBirth: { not: null } },
      select: { dateOfBirth: true },
    });

    const buckets = [
      { key: '13-17', min: 13, max: 17, count: 0 },
      { key: '18-24', min: 18, max: 24, count: 0 },
      { key: '25-34', min: 25, max: 34, count: 0 },
      { key: '35-44', min: 35, max: 44, count: 0 },
      { key: '45-54', min: 45, max: 54, count: 0 },
      { key: '55-64', min: 55, max: 64, count: 0 },
      { key: '65-80', min: 65, max: 80, count: 0 },
      { key: 'other', min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, count: 0 },
    ];

    for (const user of users) {
      const dob = user.dateOfBirth;
      if (!dob) continue;
      const age = this.calculateAge(dob);
      const bucket =
        buckets.find((b) => age >= b.min && age <= b.max) ??
        buckets[buckets.length - 1];
      bucket.count++;
    }

    return {
      totalWithDateOfBirth: users.length,
      buckets: buckets.map(({ key, count }) => ({ key, count })),
    };
  }

  private calculateAge(dob: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    const dayDiff = now.getDate() - dob.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }
    return age;
  }
}
