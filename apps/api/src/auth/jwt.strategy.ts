import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ErrorCode } from '../common/error-codes';
import type { AccessTokenPayload } from './token.types';

/** Valida el access token JWT de cada request autenticado. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (payload.type !== 'access' || !payload.sub) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Token inválido',
        code: ErrorCode.UNAUTHORIZED,
      });
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
