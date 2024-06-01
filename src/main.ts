import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/httpException.filter';
import { PrismaExceptionFilter } from './filters/prismaException.filter';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  const port = process.env.PORT;
  if (!port) {
    throw new Error('PORT is not defined');
  }
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  await app.listen(Number(port));
}

bootstrap();
