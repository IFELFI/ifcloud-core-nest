import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FolderModule } from './modules/folder.module';
import { UserModule } from './modules/user.module';
import { FileModule } from './modules/file.module';
import { VideoModule } from './modules/video.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { validate } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validate,
      isGlobal: true,
    }),
    UserModule,
    FolderModule,
    FileModule,
    VideoModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
