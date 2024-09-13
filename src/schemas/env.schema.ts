import { z } from 'zod';

export const EnvConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().default(3000),
  log: z.object({
    level: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    dest: z.string().default('logs/app.log'),
  }),
  cors: z.object({
    origin: z.string().default('*'),
  }),
  database: z.object({
    url: z.string(),
  }),
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
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
  closure: z.object({
    depth: z.number().default(3),
  }),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;
