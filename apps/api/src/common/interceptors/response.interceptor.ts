import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@pescaba/shared';

/**
 * Envuelve la respuesta en el formato consistente de la API:
 * { success: true, data, meta? }.
 * Los controladores devuelven `data` directamente; las paginaciones agregan `meta`.
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        // Permite que un controlador devuelva { data, meta } explícito.
        if (
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          ('meta' in payload || 'success' in payload)
        ) {
          const asRecord = payload as unknown as {
            success?: boolean;
            data: T;
            meta?: Record<string, unknown>;
          };
          return { success: true, data: asRecord.data, ...(asRecord.meta ? { meta: asRecord.meta } : {}) };
        }
        return { success: true, data: payload };
      }),
    );
  }
}
