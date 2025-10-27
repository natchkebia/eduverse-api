import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) throw new Error('მომხმარებელი ვერ მოიძებნა');
      return user;
    } catch (err) {
      console.error('❌ getMe() error:', err);
      throw err;
    }
  }
}
