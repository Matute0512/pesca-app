import type { PipeTransform } from '@nestjs/common';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { ZodType, ZodTypeDef, ZodError } from 'zod';
import { ErrorCode } from '../error-codes';

/**
 * Valida un valor (body/query) contra un schema zod.
 * El genérico T es el OUTPUT del schema (con defaults aplicados),
 * así `query: Infer<typeof schema>` tipa correctamente.
 * Uso: @Query(new ZodValidationPipe(schema)) query: Infer<typeof schema>
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    throw new BadRequestException({
      statusCode: 400,
      message: 'Error de validación',
      code: ErrorCode.VALIDATION_FAILED,
      details: flattenZodError(result.error),
    });
  }
}

export function flattenZodError(error: ZodError): unknown[] {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  return issues;
}
