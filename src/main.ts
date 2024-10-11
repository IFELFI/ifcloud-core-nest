import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestApplicationOptions } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './filters/httpException.filter';
import { PrismaExceptionFilter } from './filters/prismaException.filter';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from 'src/schemas/env.schema';

async function bootstrap() {
  // Server configuration
  const options: NestApplicationOptions = {
    bufferLogs: true, // Buffer logs and flush them asynchronously
  };
  const app = await NestFactory.create(AppModule, options);

  const config = app.get(ConfigService<EnvConfig, true>);

  // ----------
  // Middleware
  // ----------

  const isProduction =
    config.get<EnvConfig['nodeEnv']>('nodeEnv') === 'production';
  const isTest = config.get<EnvConfig['nodeEnv']>('nodeEnv') === 'test';

  // CORS
  if (isProduction || isTest) {
    app.enableCors({
      origin: config.get<EnvConfig['cors']>('cors').origin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
      allowedHeaders: ['Content-Type', 'x-uuid', 'x-gateway-secret'],
    });
  } else {
    app.enableCors({
      origin: config.get<EnvConfig['cors']>('cors').origin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
      allowedHeaders: ['Content-Type', 'x-uuid', 'x-gateway-secret'],
    });
  }

  // Logger
  app.useLogger(app.get(Logger));

  // Exception filters
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  await app.listen(config.get<EnvConfig['port']>('port'));
}
bootstrap();
