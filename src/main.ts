import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestApplicationOptions } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './filters/httpException.filter';
import { PrismaExceptionFilter } from './filters/prismaException.filter';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from 'src/schemas/env.schema';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';

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
  const app = await NestFactory.create(AppModule, options);

  const config = app.get(ConfigService<EnvConfig, true>);

  // ----------
  // Middleware
  // ----------

  const isProduction =
    config.get<EnvConfig['nodeEnv']>('nodeEnv') === 'production';
  const isTest = config.get<EnvConfig['nodeEnv']>('nodeEnv') === 'test';

  // CORS
  if (isProduction) {
    app.enableCors({
      origin: config.get<EnvConfig['cors']>('cors').origin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
  }

  // Session
  const cookieOptions: session.CookieOptions = {
    secure: isProduction,
    httpOnly: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
    sameSite: isProduction ? 'none' : 'lax',
  };
  let sessionStore: session.Store | undefined = undefined;
  if (isProduction || isTest) {
    const redisClient = await createClient({
      url: config.get<EnvConfig['session']>('session').storage.url,
    })
      .connect()
      .catch((err) => {
        throw new Error(err);
      });
    sessionStore = new RedisStore({ client: redisClient });
  }
  app.use(
    session({
      name: config.get<EnvConfig['session']>('session').name,
      proxy: isProduction,
      secret: config.get<EnvConfig['session']>('session').secret,
      resave: false,
      rolling: true,
      saveUninitialized: false,
      cookie: cookieOptions,
      store: sessionStore,
    }),
  );
  app.use(cookieParser(config.get<EnvConfig['session']>('session').secret));

  // Logger
  app.useLogger(app.get(Logger));

  // Exception filters
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  await app.listen(config.get<EnvConfig['port']>('port'));
}
bootstrap();
