import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TokenService } from './token.service.js';

export interface AuthUser {
  id: string;
  role: Role;
}
export type AuthedRequest = Request & { user?: AuthUser };

const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as AuthUser;
});

// Pakai `@UseGuards(AuthGuard)` di endpoint yang wajib login (checkout, order, dst).
// Endpoint tanpa guard ini tetap terbuka untuk pengunjung anonim (browsing/edit).
// `@Roles('ADMIN')` opsional untuk membatasi peran.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Login diperlukan');

    const payload = await this.tokens.verify(token);
    if (!payload) throw new UnauthorizedException('Sesi tidak valid atau sudah berakhir');

    // Cek DB tiap request supaya perubahan role / akun dihapus langsung berlaku.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });
    if (!user) throw new UnauthorizedException('Akun tidak ditemukan');

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('Tidak punya akses');
    }

    req.user = user;
    return true;
  }
}
