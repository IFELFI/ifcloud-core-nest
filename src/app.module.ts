import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FolderModule } from './modules/folder.module';
import { UserModule } from './modules/user.module';
import { JwtModule } from '@nestjs/jwt';
import { FileModule } from './modules/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UserModule,
    FolderModule,
    FileModule,
    JwtModule.register({
      global: true,
      secret: process.env.TOKEN_SECRET,
    }),
  ],
})
export class AppModule {}
