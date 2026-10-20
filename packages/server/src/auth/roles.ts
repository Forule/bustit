import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../users/index.js';

export const ROLES = 'roles';

/**
 * Limits a controller or route to users with one of the roles. Without it,
 * any logged-in user may access a route.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);
