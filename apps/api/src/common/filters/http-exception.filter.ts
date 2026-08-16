import type {
  ArgumentsHost,
  ExceptionFilter} from '@nestjs/common';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@pescaba/shared';
import { ErrorCode } from '../error-codes';

export interface HttpErrorBody {
  statusCode: number;
  message: string | string[];
  code?: string;
  details?: unknown[];
}

/**
 * Filtro global: normaliza TODAS las respuestas de error al formato
 * { success: false, error: { code, message, details } }.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let body: HttpErrorBody;

    if (exception instanceof HttpException) {
      const raw = exception.getResponse();
      status = exception.getStatus();
      if (typeof raw === 'string') {
        body = { statusCode: status, message: raw };
      } else {
        body = raw as HttpErrorBody;
      }
    } else {
      const message = exception instanceof Error ? exception.message : 'Error desconocido';
      this.logger.error(`[${request.method}] ${request.url} → ${message}`, exception instanceof Error ? exception.stack : '');
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { statusCode: status, message: 'Error interno del servidor' };
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: body.code ?? mapStatusToCode(status),
        message: Array.isArray(body.message) ? body.message.join(', ') : body.message,
        details: body.details ?? [],
      },
    };

    response.status(status).json(errorResponse);
  }
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.VALIDATION_FAILED;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCode.RATE_LIMITED;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}
