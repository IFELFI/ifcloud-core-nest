import { Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class SchemaValidationPipe<T = any> implements PipeTransform {
  constructor(private schema: z.ZodSchema<T>) {}

  async transform(value: T): Promise<T> {
    return this.schema.safeParseAsync(value).then((result) => {
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error.message);
      }
    });
  }
}
