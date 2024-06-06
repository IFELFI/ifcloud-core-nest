import {
  Controller,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserGuard } from 'src/guards/user.guard';
import fs from 'fs';
import { Response } from 'express';
import { storagePath } from 'src/utils/storagePath';

@Controller('videos')
@UseGuards(AuthGuard, UserGuard)
export class VideoController {
  constructor() {}
  @Get('/stream/generate/:folderKey/:fileKey')
  @UseGuards(RoleGuard(access_role.create))
  @HttpCode(200)
  async generateStream(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Res() res: Response,
  ): Promise<void> {
    // Generate HLS stream
  }

  @Get('/stream/:folderKey/:fileKey/master.m3u8')
  @UseGuards(RoleGuard(access_role.read))
  @HttpCode(200)
  @Header('Content-Type', 'application/x-mpegURL')
  async streamMasterPlaylist(
    @Param('fileKey', new ParseUUIDPipe()) fileKey: string,
    @Res() res: Response,
  ): Promise<void> {
    const videoDir = storagePath.videoDir;
    const videoPath = `${videoDir}/${fileKey}/master.m3u8`;
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundException('Master playlist not found');
    }
    const masterPlaylist = fs.readFileSync(videoPath, 'utf8');
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
    const videoDir = storagePath.videoDir;
    const videoPath = `${videoDir}/${fileKey}/${resolution}/${fileName}`;
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundException('Video not found');
    }
    const videoStream = fs.createReadStream(videoPath);
    videoStream.pipe(res);
  }
}
