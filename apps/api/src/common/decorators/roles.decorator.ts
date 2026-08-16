import { SetMetadata } from '@nestjs/common';
import type { Role } from '@pescaba/shared';

export const ROLES_KEY = 'roles';

/** Restringe una ruta a uno o más roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
