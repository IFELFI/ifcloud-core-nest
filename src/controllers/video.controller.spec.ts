import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { UserService } from 'src/services/user.service';
import { CheckRoleService } from 'src/services/checkRole.service';
import { PrismaService } from 'src/services/prisma.service';
import { VideoService } from 'src/services/video.service';

describe('VideoController', () => {
  let controller: VideoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [UserService, PrismaService, CheckRoleService, VideoService],
    }).compile();
    controller = module.get<VideoController>(VideoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
