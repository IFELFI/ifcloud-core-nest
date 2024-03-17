import typia, { tags } from 'typia';
import { TypiaValidationPipe } from './validation.pipe';
import { BadRequestException } from '@nestjs/common';

interface ITest {
  name: string & tags.Pattern<'^[a-zA-Z]+$'>;
  age: number & tags.Type<'uint32'>;
  email: string & tags.Format<'email'>;
  bigId: bigint;
}

const validateTest = typia.createValidate<ITest>();

describe('ValidationPipe', () => {
  let pipe: TypiaValidationPipe;

  beforeEach(() => {
    pipe = new TypiaValidationPipe(validateTest);
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
    const data = {
      name: 'John',
      age: 30,
      email: 'test@test.com',
      bigId: BigInt(1),
    };
    expect(await pipe.transform(data)).toEqual(data);
  });

  /**
   * Failure handling
   * Test if the pipe throws an error
   */
  it('should throw error', async () => {
    const data = {
      name: 'John1',
      age: 30,
      email: 'wrong-email',
      bigId: BigInt(1),
    };
    try {
      await pipe.transform(data);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toEqual(
        new BadRequestException(
          'Validation failed for $input.name, $input.email',
        ),
      );
    }
  });

  it('should throw error', async () => {
    const wrongValidator = jest.fn().mockReturnValue(false);
    const data = {
      name: 'John',
      age: 30,
      email: 'test@test.com',
      bigId: BigInt(1),
    };
    const pipe = new TypiaValidationPipe(wrongValidator);
    try {
      await pipe.transform(data);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toEqual(new BadRequestException('Validation failed'));
    }
  });
});
