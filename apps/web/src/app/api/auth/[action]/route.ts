import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_URL } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/session';
import type { SessionUser } from '@/lib/types';

// Endpoint sesi (same-origin): login menyimpan token API di cookie httpOnly sehingga tidak pernah
// terbaca JavaScript di browser (aman dari pencurian token lewat XSS).
// Sesi 30 hari, bergulir (lihat action "refresh"). Harus >= JWT_EXPIRES_IN di API.
const MAX_AGE = 30 * 24 * 60 * 60;

// Batas per IP untuk minta kode OTP (tiap kode = 1 email berbayar). Di memori: cukup untuk satu instance.
const OTP_IP_LIMIT = 10;
const OTP_IP_WINDOW_MS = 60 * 60 * 1000;
const otpHits = new Map<string, number[]>();

function otpRateLimited(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
  const now = Date.now();
  const recent = (otpHits.get(ip) ?? []).filter((t) => now - t < OTP_IP_WINDOW_MS);
  if (recent.length >= OTP_IP_LIMIT) return true;
  otpHits.set(ip, [...recent, now]);
  if (otpHits.size > 5000) otpHits.clear();
  return false;
}

async function callApi(path: string, body: unknown, token?: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
      if (otpRateLimited(request)) return NextResponse.json({ message: 'Terlalu banyak permintaan kode dari jaringan ini. Coba lagi nanti atau masuk dengan Google.' }, { status: 429 });
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
    // Sesi bergulir: token lama yang masih valid ditukar dengan token baru (masa berlaku dihitung ulang).
    case 'refresh': {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (!token) return NextResponse.json({ message: 'Belum login' }, { status: 401 });
      const { res, json } = await callApi('/auth/refresh', {}, token);
      if (!res.ok) return fail(res.status, json, 'Sesi tidak valid');
      const response = NextResponse.json({ ok: true });
      response.cookies.set(SESSION_COOKIE, json.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: MAX_AGE,
      });
      return response;
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
