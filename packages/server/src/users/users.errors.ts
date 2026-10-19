export class UsernameTakenError extends Error {
  constructor(readonly username: string) {
    super(`Username ${username} is taken`);
    this.name = 'UsernameTakenError';
  }
}
