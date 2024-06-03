import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { VideoController } from 'src/controllers/video.controller';
import { CheckRoleService } from 'src/services/checkRole.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: 'test/sample/video',
      serveRoot: '/videos/stream',
    }),
  ],
  providers: [CheckRoleService, PrismaService, UserService],
  controllers: [VideoController],
})
export class VideoModule {}
