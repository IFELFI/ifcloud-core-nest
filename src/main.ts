import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/httpException.filter';
import { PrismaExceptionFilter } from './filters/prismaException.filter';
import fs from 'fs';
import 'dotenv/config';

async function bootstrap() {
  await setup();
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  await app.listen(3000);
}

async function setup() {
  // Make storage folder public
  const storagePath = process.env.STORAGE_PATH;
  if (!storagePath) {
    throw new Error('STORAGE_PATH is not defined');
  }
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
}

bootstrap();
