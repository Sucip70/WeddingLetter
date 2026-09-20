import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from './api';
import type { SessionUser } from './types';

export const SESSION_COOKIE = 'wl_session';

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

// Pengguna saat ini (null bila belum login / token kedaluwarsa). Dedupe per request.
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    return await apiFetch<SessionUser>('/auth/me', { token });
  } catch {
    return null;
  }
});

export async function requireUser(next: string) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser('/admin');
  if (user.role !== 'ADMIN') redirect('/dashboard');
  return user;
}

// Fetch ke API dengan token sesi (server component). Kegagalan 401 -> ke halaman login.
export async function authedFetch<T>(path: string, next: string): Promise<T> {
  const token = await getToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(next)}`);
  try {
    return await apiFetch<T>(path, { token });
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401) {
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
    throw error;
  }
}
