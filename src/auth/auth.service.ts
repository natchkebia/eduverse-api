import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // 🟢 რეგისტრაცია
  async register(
    email: string,
    password: string,
    name: string,
    surname?: string,
    phone?: string,
  ) {
    // შეამოწმე არსებობს თუ არა უკვე მომხმარებელი ელფოსტით ან ტელეფონით
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });
    if (existingUser) {
      throw new ConflictException(
        'ამ ელფოსტით ან ნომრით მომხმარებელი უკვე არსებობს!',
      );
    }

    // პაროლის დაშიფვრა
    const hashedPassword = await bcrypt.hash(password, 10);

    // ახალი მომხმარებლის შექმნა
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname: surname || undefined,
        phone: phone || undefined,
        role: Role.STUDENT, // ✅ default როლი
      },
    });

    // JWT ტოკენის გენერაცია
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, // ✅ userId უნდა დაემთხვეს req.user.userId-ს
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' },
    );

    return { accessToken: token };
  }

  // 🟡 ავტორიზაცია
  async login(email: string, password: string) {
    // მოძებნე მომხმარებელი ელფოსტით
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('მომხმარებელი ვერ მოიძებნა');
    }

    // შეამოწმე პაროლი
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('პაროლი არასწორია');
    }

    // JWT ტოკენის გენერაცია
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, // 👈 იგივე userId
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' },
    );

    return { accessToken: token };
  }
}
