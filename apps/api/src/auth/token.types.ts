import type { Role } from '@pescaba/shared';

/** Payload del access token. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  type: 'access';
}

/** Payload del refresh token. */
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

/** Par de tokens emitidos. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
}
