import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type JwtSignOptions } from '@nestjs/jwt';
import type { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import type { PublicUser, Role } from '@pescaba/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ErrorCode } from '../common/error-codes';
import { parseDurationToSeconds } from '../common/utils/time';
import { NotifierService } from './notifier.service';
import type { AccessTokenPayload, RefreshTokenPayload, TokenPair } from './token.types';

const REFRESH_PREFIX = 'refresh:';
const RESET_PREFIX = 'reset:';

/** Convierte el enum de rol de Prisma (USER) al rol del dominio (user). */
function toRole(role: UserRole): Role {
  return role.toLowerCase() as Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly notifier: NotifierService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    username?: string;
    fullName?: string;
    preferredLanguage?: string;
  }): Promise<TokenPair> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Ya existe una cuenta con ese email',
        code: ErrorCode.EMAIL_TAKEN,
      });
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        username: input.username,
        fullName: input.fullName,
        passwordHash,
        preferredLanguage: input.preferredLanguage ?? 'es',
      },
    });

    return this.issueTokenPair(user.id, user.email, toRole(user.role));
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Credenciales inválidas',
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Credenciales inválidas',
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    }
    return this.issueTokenPair(user.id, user.email, toRole(user.role));
  }

  /** Refresca la sesión con rotación: invalida el refresh anterior y emite uno nuevo. */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.redis.get(`${REFRESH_PREFIX}${payload.jti}`);
    if (!stored || stored !== payload.sub) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Refresh token inválido o expirado',
        code: ErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Cuenta no encontrada',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }

    // Rotación: revocar el jti anterior antes de emitir el nuevo.
    await this.redis.del(`${REFRESH_PREFIX}${payload.jti}`);
    return this.issueTokenPair(user.id, user.email, toRole(user.role));
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.redis.del(`${REFRESH_PREFIX}${payload.jti}`);
    } catch {
      // Logout idempotente: si el token ya no es válido, igual se considera logout.
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
    });
    // No revelar si el email existe o no.
    if (!user) {
      return;
    }
    const token = randomUUID();
    const ttl = parseDurationToSeconds('1h');
    await this.redis.set(`${RESET_PREFIX}${token}`, user.id, ttl);
    await this.notifier.sendResetPassword(user.email, token);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const userId = await this.redis.get(`${RESET_PREFIX}${token}`);
    if (!userId) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Token inválido o expirado',
        code: ErrorCode.VALIDATION_FAILED,
      });
    }
    const passwordHash = await argon2.hash(password);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(`${RESET_PREFIX}${token}`);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Usuario no encontrado',
        code: ErrorCode.USER_NOT_FOUND,
      });
    }
    return this.toPublicUser(user);
  }

  async updateMe(
    userId: string,
    data: {
      username?: string;
      fullName?: string | null;
      preferredLanguage?: string;
      preferredUnits?: 'metric' | 'imperial';
    },
  ): Promise<PublicUser> {
    if (data.username) {
      const conflict = await this.prisma.user.findFirst({
        where: { username: data.username, NOT: { id: userId }, deletedAt: null },
      });
      if (conflict) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Ese nombre de usuario ya está en uso',
          code: ErrorCode.USERNAME_TAKEN,
        });
      }
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: data.username,
        fullName: data.fullName === undefined ? undefined : data.fullName,
        preferredLanguage: data.preferredLanguage,
        preferredUnits: data.preferredUnits,
      },
    });
    return this.toPublicUser(user);
  }

  /** Elimina la cuenta (soft delete). */
  async deleteMe(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  // ────────────────────────────────────────────── Helpers

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
      if (payload.type !== 'refresh' || !payload.jti) {
        throw new Error('tipo inválido');
      }
      return payload;
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Refresh token inválido o expirado',
        code: ErrorCode.INVALID_REFRESH_TOKEN,
      });
    }
  }

  private async issueTokenPair(userId: string, email: string, role: PublicUser['role']): Promise<TokenPair> {
    const accessPayload: AccessTokenPayload = { sub: userId, email, role, type: 'access' };
    const refreshJti = randomUUID();
    const refreshPayload: RefreshTokenPayload = { sub: userId, jti: refreshJti, type: 'refresh' };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.getOrThrow<string>('jwt.accessTtl') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.config.getOrThrow<string>('jwt.refreshTtl') as JwtSignOptions['expiresIn'],
    });

    const refreshTtlSeconds = parseDurationToSeconds(
      this.config.getOrThrow<string>('jwt.refreshTtl'),
    );
    await this.redis.set(`${REFRESH_PREFIX}${refreshJti}`, userId, refreshTtlSeconds);

    const accessTtlSeconds = parseDurationToSeconds(
      this.config.getOrThrow<string>('jwt.accessTtl'),
    );

    return { accessToken, refreshToken, accessExpiresIn: accessTtlSeconds };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    emailVerified: boolean;
    preferredLanguage: string;
    preferredUnits: string;
    createdAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: toRole(user.role),
      emailVerified: user.emailVerified,
      preferredLanguage: user.preferredLanguage,
      preferredUnits: user.preferredUnits,
      createdAt: user.createdAt,
    };
  }
}
