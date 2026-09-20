import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_URL } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/session';
import type { SessionUser } from '@/lib/types';

// Endpoint sesi (same-origin): login menyimpan token API di cookie httpOnly sehingga tidak pernah
// terbaca JavaScript di browser (aman dari pencurian token lewat XSS).
const MAX_AGE = 7 * 24 * 60 * 60;

async function callApi(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

function fail(status: number, json: unknown, fallback: string) {
  const message =
    json && typeof json === 'object' && 'message' in json && typeof (json as { message: unknown }).message === 'string'
      ? (json as { message: string }).message
      : fallback;
  return NextResponse.json({ message }, { status });
}

function withSession(user: SessionUser, accessToken: string) {
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return response;
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/auth/[action]'>) {
  const { action } = await ctx.params;
  const body = await request.json().catch(() => ({}));

  switch (action) {
    case 'otp-request': {
      const { res, json } = await callApi('/auth/otp/request', { email: body.email });
      return res.ok ? NextResponse.json(json) : fail(res.status, json, 'Gagal mengirim kode');
    }
    case 'otp-verify': {
      const { res, json } = await callApi('/auth/otp/verify', { email: body.email, code: body.code, name: body.name || undefined });
      return res.ok ? withSession(json.user, json.accessToken) : fail(res.status, json, 'Kode salah atau kedaluwarsa');
    }
    case 'google': {
      const { res, json } = await callApi('/auth/google', { idToken: body.idToken });
      return res.ok ? withSession(json.user, json.accessToken) : fail(res.status, json, 'Login Google gagal');
    }
    case 'logout': {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    default:
      return NextResponse.json({ message: 'Tidak ditemukan' }, { status: 404 });
  }
}
