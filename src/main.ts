import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // ─── Startup guard: crash loudly if critical secrets are missing ───────────
  if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is not set. Aborting.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ─── Security headers (Helmet) ─────────────────────────────────────────────
  app.use(helmet());

  // ─── Cookie parser ─────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ─── Body size limit ───────────────────────────────────────────────────────
  app.use(require('express').json({ limit: '100kb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '100kb' }));

  // ─── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,            // Auto-cast primitives
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // ─── CORS — driven by FRONTEND_URL env var ────────────────────────────────
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const allowedOrigins = frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Start server ──────────────────────────────────────────────────────────
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Server is running on http://localhost:${port}`);
}

bootstrap();
