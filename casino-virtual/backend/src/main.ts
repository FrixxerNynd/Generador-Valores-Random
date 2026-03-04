import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitamos validación global con class-validator
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Habilitamos llamadas desde diferentes puertos (CORS)
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
