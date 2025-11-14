import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

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

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname: surname || null,
        phone: phone || null,
        role: Role.STUDENT,
        provider: 'local',
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return { accessToken: token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new UnauthorizedException('მომხმარებელი ვერ მოიძებნა');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('პაროლი არასწორია');

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return { accessToken: token };
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
          role: Role.STUDENT,
        },
      });
    }
    return this.prisma.user.update({
      where: { id: existing.id },
      data: {
        provider: oauthUser.provider,
        avatar: oauthUser.avatar || existing.avatar,
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
