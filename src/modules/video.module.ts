import { Module } from '@nestjs/common';
import { VideoController } from 'src/controllers/video.controller';
import { CheckRoleService } from 'src/services/checkRole.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';
import { VideoService } from 'src/services/video.service';

@Module({
  controllers: [VideoController],
  providers: [UserService, PrismaService, CheckRoleService, VideoService],
})
export class VideoModule {}
