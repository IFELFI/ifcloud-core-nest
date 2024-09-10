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
    origin: z.string(),
  }),
  database: z.object({
    url: z.string(),
  }),
  session: z.object({
    name: z.string(),
    secret: z.string(),
    storage: z.object({
      url: z.optional(z.string()),
    }),
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
