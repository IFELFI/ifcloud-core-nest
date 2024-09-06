import { z } from 'zod';

export const SpecialContainerNameSchema = z.enum(['root', 'trash', 'home']);

export type SpecialContainerName = z.infer<typeof SpecialContainerNameSchema>;
