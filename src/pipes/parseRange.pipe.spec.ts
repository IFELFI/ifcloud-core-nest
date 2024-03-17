import { BadRequestException } from '@nestjs/common';
import { ParseRangePipe } from './parseRange.pipe';

describe('ParseRangePipe', () => {
  let pipe: ParseRangePipe;

  beforeEach(() => {
    pipe = new ParseRangePipe();
  });

  // Test if the pipe is defined
  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  /**
   * Success handling
   * Test if the pipe is successfully done
   */
  it('should validate', async () => {
    const data = 'bytes=0-10';
    expect(await pipe.transform(data)).toEqual(10);
  });

  /**
   * Failure handling
   * Test if the pipe throws an error
   */
  it('should throw error', async () => {
    const data = 'wrong-range';
    try {
      await pipe.transform(data);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toEqual(new BadRequestException('Invalid range format'));
    }
  });

  it('should throw error', async () => {
    const data = 'bytes=0-10-20';
    try {
      await pipe.transform(data);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toEqual(new BadRequestException('Invalid range format'));
    }
  });
});
