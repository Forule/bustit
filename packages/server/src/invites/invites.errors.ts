/**
 * One error for unknown, used and expired codes alike, so a response built on
 * it doesn't tell which codes exist.
 */
export class InvalidInviteError extends Error {
  constructor() {
    super('The invite code is invalid, used or expired');
    this.name = 'InvalidInviteError';
  }
}
