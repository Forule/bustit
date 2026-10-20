import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/index.js';
import { AuthTokenService } from './auth-token.service.js';
import { bearerTokenOf } from './bearer-token.js';
import type { AuthenticatedRequest } from './current-user.js';
import { IS_PUBLIC } from './public.js';

/**
 * Applies to every route unless it is marked `@Public()`. A token only counts
 * while its user exists, isn't disabled and still has the token version the
 * token was issued with.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authTokenService: AuthTokenService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerTokenOf(request.headers.authorization);
    const claims = token
      ? await this.authTokenService.verifyToken(token)
      : null;
    const user = claims && (await this.usersService.findById(claims.userId));

    if (!user || user.disabledAt || user.tokenVersion !== claims.tokenVersion) {
      throw new UnauthorizedException();
    }

    request.user = { id: user.id, username: user.username, role: user.role };

    return true;
  }
}
