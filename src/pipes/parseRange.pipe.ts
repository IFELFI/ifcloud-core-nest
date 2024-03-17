import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseRangePipe implements PipeTransform {
  async transform(value: string): Promise<number> {
    if (this.isRange(value)) {
      const range: number = Number(value.replace(/\D/g, ''));
      return range;
    }
    throw new BadRequestException('Invalid range format');
  }

  private isRange(value: any): value is string {
    return typeof value === 'string' && value.match(/^bytes=\d+-\d+$/) !== null;
  }
}
