import { BadRequestException, PipeTransform } from '@nestjs/common';

export class StringLengthPipe implements PipeTransform {
  constructor(
    private readonly minLength: number,
    private readonly maxLength: number,
  ) {}

  transform(value: string) {
    if (!value) {
      throw new BadRequestException('The string is empty');
    }
    if (value.length < this.minLength || value.length > this.maxLength) {
      throw new BadRequestException(
        `The string length must be between ${this.minLength} and ${this.maxLength}`,
      );
    }
    return value;
  }
}
