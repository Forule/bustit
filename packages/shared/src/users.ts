import { z } from 'zod';

/** What a user sees about their own account. */
export const userProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(['admin', 'player']),
  balance: z.number().int(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
