import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './configs/env.config';
import { CustomLogger } from './modules/logger.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { MemberModule } from './modules/member.module';
import { FileModule } from './modules/file/index.module';
import { UploadModule } from './modules/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validate,
      isGlobal: true,
    }),
    CustomLogger,
    MemberModule,
    UploadModule,
    FileModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
