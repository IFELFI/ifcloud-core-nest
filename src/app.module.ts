import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './configs/env.config';
import { CustomLogger } from './modules/logger.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { MemberModule } from './modules/member.module';
import { FileModule } from './modules/file/index.module';
import { UploadModule } from './modules/upload.module';
import { StreamModule } from './modules/stream.module';
import { PrismaModule } from './modules/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validate,
      isGlobal: true,
    }),
    PrismaModule,
    CustomLogger,
    MemberModule,
    UploadModule,
    StreamModule,
    FileModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
