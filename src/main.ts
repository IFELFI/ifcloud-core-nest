import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestApplicationOptions } from '@nestjs/common';

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
  };
  const port = process.env.PORT || 3000;

  const app = await NestFactory.create(AppModule, options);
  await app.listen(port);
}
bootstrap();
