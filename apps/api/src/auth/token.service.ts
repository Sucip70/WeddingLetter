import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';

export interface AccessTokenPayload {
  sub: string;
}

@Injectable()
export class TokenService {
  private get secret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || (secret === 'change-me' && process.env.NODE_ENV === 'production')) {
      throw new Error('JWT_SECRET belum di-set dengan benar');
    }
    return new TextEncoder().encode(secret);
  }

  sign(userId: string) {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_EXPIRES_IN ?? '7d')
      .sign(this.secret);
  }

  // Mengembalikan null kalau token tidak valid/kedaluwarsa.
  async verify(token: string): Promise<AccessTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, { algorithms: ['HS256'] });
      return payload.sub ? { sub: payload.sub } : null;
    } catch {
      return null;
    }
  }
}
