import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // მომხმარებლის მიღება Dashboard-ისთვის
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

  // პაროლის განახლება (პირად მონაცემებში)
  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // შიდა გამოყენებისთვის – მომხმარებლის მოძებნა ID-ით
  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}