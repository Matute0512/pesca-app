import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
} from '@pescaba/shared';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'usuario@example.com' },
        password: { type: 'string', format: 'password', example: 'Contrasena123!' },
        username: { type: 'string', example: 'pescador' },
      },
    },
  })
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión (email + contraseña)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'demo.admin@pescaba.dev' },
        password: { type: 'string', format: 'password', example: 'PescaDemo123!' },
      },
    },
  })
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar sesión con refresh token (rotación)' })
  @ApiBody({ schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } })
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión (revoca el refresh token)' })
  @ApiBody({ schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } })
  async logout(@Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken: string }): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de contraseña' })
  @ApiBody({ schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } })
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: { email: string }): Promise<void> {
    await this.auth.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar reset de contraseña con token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token', 'password'],
      properties: {
        token: { type: 'string', description: 'Token recibido por email' },
        password: { type: 'string', format: 'password' },
      },
    },
  })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: { token: string; password: string },
  ): Promise<void> {
    await this.auth.resetPassword(body.token, body.password);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id);
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar el perfil del usuario' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.auth.updateMe(user.id, body);
  }

  @ApiBearerAuth()
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar la cuenta (soft delete)' })
  async deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.auth.deleteMe(user.id);
  }
}
