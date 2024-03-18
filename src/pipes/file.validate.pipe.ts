import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileValidatePipe implements PipeTransform {
  transform(value: Express.Multer.File) {
    if (this.isFile(value)) {
      return value;
    }
    throw new BadRequestException('Invalid file');
  }

  isFile(value: any): value is Express.Multer.File {
    return typeof value === 'object' && value.buffer !== undefined;
  }
}
