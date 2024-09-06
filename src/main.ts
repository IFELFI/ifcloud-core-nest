import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestApplicationOptions } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './filters/httpException.filter';
import { PrismaExceptionFilter } from './filters/prismaException.filter';

async function bootstrap() {
  // Server configuration
  const options: NestApplicationOptions = {
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
      allowedHeaders: ['Content-Type', 'x-uuid', 'x-gateway-secret'],
    },
    bufferLogs: true, // Buffer logs and flush them asynchronously
  };
  const port = process.env.PORT || 3000;

  const app = await NestFactory.create(AppModule, options);
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  await app.listen(port);
}
bootstrap();
