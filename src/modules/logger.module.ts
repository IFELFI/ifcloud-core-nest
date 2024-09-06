import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { EnvConfig } from 'src/schemas/env.schema';
import pino from 'pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        pinoHttp: {
          level: config.get<EnvConfig['log']>('log').level,
        },
        stream: pino.destination({
          dest: config.get<EnvConfig['log']>('log').dest,
          sync: false,
        }),
      }),
    }),
  ],
})
export class CustomLogger {}
