import {
  BadRequestException,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import typia from 'typia';

@Injectable()
export class TypiaValidationPipe<T = any, R = any> implements PipeTransform {
  constructor(private validator: (input: unknown) => typia.IValidation<any>) {}
  transform(value: T): R {
    try {
      const result = this.validator(value);
      if (result.success) {
        return result.data;
      }
      const errorPath = result.errors.map((error) => error.path).join(', ');
      throw new BadRequestException(`Validation failed for ${errorPath}`);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
