import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Global() // ეს ნიშნავს, რომ ყველგან ხელმისაწვდომია
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
