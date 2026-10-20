import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '../users/index.js';

export type AuthenticatedUser = {
  readonly id: string;
  readonly username: string;
  readonly role: UserRole;
};

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };

/** The logged-in user, set by the `AuthGuard`. */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
