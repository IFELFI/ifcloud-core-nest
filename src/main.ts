import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/httpException.filter';
import { PrismaExceptionFilter } from './filters/prismaException.filter';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  await app.listen(3000);
}
bootstrap();
