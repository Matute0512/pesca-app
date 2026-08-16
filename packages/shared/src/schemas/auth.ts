import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  username: z.string().min(3).max(40).regex(/^[a-z0-9._-]+$/i, 'Usuario inválido').optional(),
  fullName: z.string().max(120).optional(),
  preferredLanguage: z.string().min(2).max(8).default('es'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(1, 'Contraseña requerida').max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

export const updateProfileSchema = z
  .object({
    username: z.string().min(3).max(40).regex(/^[a-z0-9._-]+$/i, 'Usuario inválido').optional(),
    fullName: z.string().max(120).nullish(),
    preferredLanguage: z.string().min(2).max(8).optional(),
    preferredUnits: z.enum(['metric', 'imperial']).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
