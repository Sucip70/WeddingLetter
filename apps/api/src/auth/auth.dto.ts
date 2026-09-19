import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Email tidak valid'));

export const requestOtpSchema = z.object({ email });

export const verifyOtpSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, 'Kode harus 6 digit'),
  // Hanya dipakai saat akun baru dibuat.
  name: z.string().trim().min(1).max(100).optional(),
});

export const googleLoginSchema = z.object({ idToken: z.string().min(1) });

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(result.error.issues.map((i) => i.message).join('; '));
  }
  return result.data;
}
