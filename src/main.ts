import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ FRONTEND-ის მისამართები რომ იმუშაოს
  app.enableCors({
    origin: [
      'http://localhost:3001', // ფრონტი 3001-ზე
      'http://localhost:3002', // მეორე პორტი თუ გაქვს dev-ში
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // 🟢 შეცვალე პორტი აქ
  await app.listen(3000);
  console.log('🚀 Server is running on http://localhost:3000');
}
bootstrap();
