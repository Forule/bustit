import { z } from 'zod';

export const inviteStatusSchema = z.enum([
  'open',
  'used',
  'revoked',
  'expired',
]);

export type InviteStatus = z.infer<typeof inviteStatusSchema>;

/** An invite as the operations console shows it; never includes the code. */
export const inviteSchema = z.object({
  id: z.string(),
  status: inviteStatusSchema,
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  usedAt: z.iso.datetime().nullable(),
  usedBy: z.string().nullable(),
  revokedAt: z.iso.datetime().nullable(),
});

export type Invite = z.infer<typeof inviteSchema>;

/** The plain code is only ever returned here, right after creating it. */
export const createdInviteSchema = z.object({
  invite: inviteSchema,
  code: z.string(),
});

export type CreatedInvite = z.infer<typeof createdInviteSchema>;
