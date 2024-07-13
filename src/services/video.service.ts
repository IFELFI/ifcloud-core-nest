import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { storagePath } from 'src/utils/storagePath';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class VideoService {
  constructor(private prisma: PrismaService) {}

  async convertVideoToHLS(fileKey: string): Promise<void> {
    // Convert video to HLS
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist');
    }
    const originFileName = `${fileKey}${path.extname(file.file_name)}`;
    const originPath = path.join(storagePath.originDir, originFileName);
    if (!fs.existsSync(originPath)) {
      this.prisma.files.delete({
        where: {
          file_key: fileKey,
        },
      });
      throw new InternalServerErrorException('File does not exist in storage');
    }
    const savedVideoDir = path.join(storagePath.videoDir, fileKey);
    // progress on child process
    //     ffmpeg -i vid.mp4 -preset veryfast -threads 0 `
    // -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 `
    // -c:v libx264 -crf 22 -c:a aac -ar 48000 `
    // -filter:v:0 scale=-2:360 -maxrate:v:0 600k -b:a:0 64k `
    // -filter:v:1 scale=-2:720 -maxrate:v:1 900k -b:a:1 128k `
    // -filter:v:2 scale=-2:1080 -maxrate:v:2 900k -b:a:2 128k `
    // -f hls -hls_time 10 -hls_playlist_type vod -hls_list_size 0 -hls_flags independent_segments `
    // -var_stream_map "v:0,a:0,name:360p v:1,a:1,name:720p v:2,a:2,name:1080p" `
    // -master_pl_name %savedVideoDir/master.m3u8 `
    // -hls_segment_filename "%savedVideoDir/res_%v/file_%03d.ts" `
    // "%savedVideoDir/res_%v/index.m3u8"
    const process = spawn('ffmpeg', [
      '-i',
      originPath,
      '-preset',
      'veryfast',
      '-threads',
      '0',
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',
      '-c:v',
      'libx264',
      '-crf',
      '22',
      '-c:a',
      'aac',
      '-ar',
      '48000',
      '-filter:v:0',
      'scale=-2:360',
      '-maxrate:v:0',
      '600k',
      '-b:a:0',
      '64k',
      '-filter:v:1',
      'scale=-2:720',
      '-maxrate:v:1',
      '900k',
      '-b:a:1',
      '128k',
      '-filter:v:2',
      'scale=-2:1080',
      '-maxrate:v:2',
      '900k',
      '-b:a:2',
      '128k',
      '-f',
      'hls',
      '-hls_time',
      '10',
      '-hls_playlist_type',
      'vod',
      '-hls_list_size',
      '0',
      '-hls_flags',
      'independent_segments',
      '-var_stream_map',
      'v:0,a:0,name:360p v:1,a:1,name:720p v:2,a:2,name:1080p',
      '-master_pl_name',
      `${savedVideoDir}/master.m3u8`,
      '-hls_segment_filename',
      `${savedVideoDir}/res_%v/file_%03d.ts`,
      `${savedVideoDir}/res_%v/index.m3u8`,
    ]);
    process.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    process.on('close', (code) => {
      if (code !== 0) {
        throw new InternalServerErrorException('Failed to convert video');
      }
    });
    process.on('error', (error) => {
      throw new InternalServerErrorException('Failed to convert video');
    });
  }

  async generateStream(fileKey: string): Promise<void> {
    // Generate stream
  }

  async getMasterPlaylist(fileKey: string): Promise<string> {
    const masterPlaylistPath = path.join(
      storagePath.videoDir,
      fileKey,
      'master.m3u8',
    );
    if (!fs.existsSync(masterPlaylistPath)) {
      throw new NotFoundException('Master playlist not found');
    }
    const masterPlaylist = fs.readFileSync(masterPlaylistPath, 'utf8');
    return masterPlaylist;
  }

  async streamVideoFile(
    fileKey: string,
    resolution: string,
    fileName: string,
  ): Promise<fs.ReadStream> {
    // Stream video file
    const videoPath = path.join(
      storagePath.videoDir,
      fileKey,
      resolution,
      fileName,
    );
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundException('Video not found');
    }
    const videoStream = fs.createReadStream(videoPath);
    return videoStream;
  }
}
