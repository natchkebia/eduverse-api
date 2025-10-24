import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module'; // დაამატე ეს

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // .env იმუშავებს ყველგან
    PrismaModule, // PrismaService ხელმისაწვდომი ხდება
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
