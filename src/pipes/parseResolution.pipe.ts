import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { VideoResolution } from 'src/interfaces/file.interface';

@Injectable()
export class ParseResolutionPipe implements PipeTransform {
  async transform(value: string): Promise<VideoResolution> {
    if (this.isResolution(value)) {
      return value;
    }
    throw new BadRequestException('Invalid resolution');
  }

  private isResolution(value: any): value is VideoResolution {
    return (
      ['240p', '360p', '480p', '720p', '1080p'].indexOf(value) !== -1 &&
      typeof value === 'string'
    );
  }
}
