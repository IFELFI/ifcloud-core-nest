import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { storagePath } from 'src/utils/storagePath';
import fs from 'fs';
import path from 'path';

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
  }

  async generateStream(fileKey: string): Promise<void> {
    // Generate stream
  }

  async streamMasterPlaylist(fileKey: string): Promise<void> {
    // Stream master playlist
  }

  async streamVideoFile(
    fileKey: string,
    resolution: string,
    fileName: string,
  ): Promise<void> {
    // Stream video file
  }
}
