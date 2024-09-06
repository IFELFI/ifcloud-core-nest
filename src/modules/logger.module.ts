import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { envConfig } from 'src/schemas/env.schema';
import pino from 'pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<envConfig, true>) => ({
        pinoHttp: {
          level: config.get<envConfig['log']>('log').level,
        },
        stream: pino.destination({
          dest: config.get<envConfig['log']>('log').dest,
          sync: false,
        }),
      }),
    }),
  ],
})
export class CustomLogger {}
