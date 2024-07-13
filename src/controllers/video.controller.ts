import {
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { RoleGuard } from 'src/guards/role.guard';
import { UserGuard } from 'src/guards/user.guard';
import { Response } from 'express';
import { VideoService } from 'src/services/video.service';

@Controller('videos')
@UseGuards(UserGuard)
export class VideoController {
  constructor(private videoService: VideoService) {}
  @Get('/stream/generate/:folderKey/:fileKey')
  @UseGuards(RoleGuard(access_role.create))
  @HttpCode(200)
  async generateStream(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
  ): Promise<string> {
    // Generate HLS stream
    this.videoService.convertVideoToHLS(fileKey);
    return 'Stream generated';
  }

  @Get('/stream/:folderKey/:fileKey/master.m3u8')
  @UseGuards(RoleGuard(access_role.read))
  @HttpCode(200)
  @Header('Content-Type', 'application/x-mpegURL')
  async streamMasterPlaylist(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Res() res: Response,
  ): Promise<void> {
    const masterPlaylist = await this.videoService.getMasterPlaylist(fileKey);
    res.send(masterPlaylist);
  }

  @Get('stream/:folderKey/:fileKey/:resolution/:fileName')
  @UseGuards(RoleGuard(access_role.read))
  @HttpCode(200)
  async streamVideoFile(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Param('resolution') resolution: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<void> {
    const videoStream = await this.videoService.streamVideoFile(
      fileKey,
      resolution,
      fileName,
    );
    videoStream.pipe(res);
  }
}
