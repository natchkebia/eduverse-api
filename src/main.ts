import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🟢 აუცილებელია cookie-ზე მუშაობისთვის
  app.use(cookieParser());

  // ✅ FRONTEND-ის მისამართები რომ იმუშაოს
  app.enableCors({
    origin: [
      'http://localhost:3001', // ფრონტი 3001-ზე
      'http://127.0.0.1:3001', // 👈 დაამატე ეს
      'http://localhost:3002', // მეორე პორტი თუ გაქვს dev-ში
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // cookie გადაცემა frontend↔backend
  });

  await app.listen(3000);
  console.log('🚀 Server is running on http://localhost:3000');
}
bootstrap();
