import { z } from 'zod';

export const SpecialContainerName = z.enum(['root', 'trash', 'home']);

export type SpecialContainerName = z.infer<typeof SpecialContainerName>;
