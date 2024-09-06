import { z } from 'zod';
import { SchemaValidationPipe } from '../validation.pipe';

describe('ValidationPipe', () => {
  let pipe: SchemaValidationPipe;

  const emailSchema = z.object({
    email: z.string().email(),
  });

  type Email = z.infer<typeof emailSchema>;

  beforeEach(() => {
    pipe = new SchemaValidationPipe(emailSchema);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return the email', async () => {
    const email: Email = {
      email: 'test@test.com',
    };

    const result = await pipe.transform(email);
    expect(result).toEqual(email);
  });

  it('should throw an error', async () => {
    const email: Email = {
      email: 'test',
    };

    await expect(pipe.transform(email)).rejects.toThrow();
  });
});
