import { Injectable, Logger } from '@nestjs/common';

/**
 * Enviador de notificaciones. En el MVP no hay proveedor de email configurado:
 * NotifierService registra la acción en logs (dev) para que el flujo
 * forgot/reset password sea funcional localmente. Un proveedor real
 * (SMTP/Resend/SES) puede reemplazar esta implementación sin tocar el flujo.
 */
@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  async sendResetPassword(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env['PUBLIC_API_URL'] ?? 'http://localhost:3000'}/v1/auth/reset-password?token=${token}`;
    this.logger.warn(
      `[DEV] Reset de contraseña para ${email}. En producción se envía por email. Link: ${resetUrl}`,
    );
  }
}
