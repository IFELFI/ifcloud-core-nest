import { BadRequestException } from '@nestjs/common';
import { ParseResolutionPipe } from './parseResolution.pipe';

describe('ParseResolutionPipe', () => {
  let pipe: ParseResolutionPipe;

  beforeEach(() => {
    pipe = new ParseResolutionPipe();
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
    const data = '240p';
    expect(await pipe.transform(data)).toEqual(data);
  });

  /**
   * Failure handling
   * Test if the pipe throws an error
   */
  it('should throw error', async () => {
    const data = 'wrong-resolution';
    try {
      await pipe.transform(data);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toEqual(new BadRequestException('Invalid resolution'));
    }
  });
});
