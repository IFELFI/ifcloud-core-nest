import { z } from 'zod';

export const envConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  log: z.object({
    level: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    dest: z.string().default('logs/app.log'),
  }),
  database: z.object({
    url: z.string(),
  }),
  gateway: z.object({
    secret: z.string(),
  }),
  keyName: z.object({
    gateway: z.string(),
    uuid: z.string(),
  }),
  test: z.object({
    uuid: z.optional(z.string()),
  }),
});

export type envConfig = z.infer<typeof envConfigSchema>;
