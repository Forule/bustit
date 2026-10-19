export class InsufficientBalanceError extends Error {
  constructor(
    readonly userId: string,
    readonly delta: number,
  ) {
    super(`Balance of user ${userId} doesn't cover ${delta}`);
    this.name = 'InsufficientBalanceError';
  }
}
