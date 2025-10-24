import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001', // შენი frontend
      'https://patrological-liana-unobstructed.ngrok-free.dev', // ngrok ბმული
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
}
bootstrap();
