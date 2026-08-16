import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Role } from '@pescaba/shared';

/** Usuario autenticado inyectado por el JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

/** Extrae el usuario del request (inyectado por JwtStrategy.validate). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
