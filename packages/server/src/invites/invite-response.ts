import type {
  CreatedInvite as CreatedInviteResponse,
  Invite as InviteResponse,
  InviteStatus,
} from '@bustit/shared';
import type { Invite } from './invites.schema.js';

/** Leaves out the code hash, which has no use outside the server. */
export function toInviteResponse(
  invite: Invite,
  status: InviteStatus,
): InviteResponse {
  return {
    id: invite.id,
    status,
    createdBy: invite.createdBy,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
    usedAt: invite.usedAt?.toISOString() ?? null,
    usedBy: invite.usedBy,
    revokedAt: invite.revokedAt?.toISOString() ?? null,
  };
}

export function toCreatedInviteResponse(
  invite: Invite,
  code: string,
): CreatedInviteResponse {
  return { invite: toInviteResponse(invite, 'open'), code };
}
