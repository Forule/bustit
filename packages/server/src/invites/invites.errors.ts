/**
 * One error for unknown, used, revoked and expired codes alike, so a response
 * built on it doesn't tell which codes exist.
 */
export class InvalidInviteError extends Error {
  constructor() {
    super('The invite code is invalid, used, revoked or expired');
    this.name = 'InvalidInviteError';
  }
}

export class InviteNotFoundError extends Error {
  constructor(readonly inviteId: string) {
    super(`No invite ${inviteId}`);
    this.name = 'InviteNotFoundError';
  }
}

export class InviteUsedError extends Error {
  constructor(readonly inviteId: string) {
    super(`Invite ${inviteId} is used and can't be revoked`);
    this.name = 'InviteUsedError';
  }
}
