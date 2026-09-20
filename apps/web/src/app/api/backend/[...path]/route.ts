import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_URL } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/session';

// Proxy same-origin ke API NestJS: menambahkan Authorization dari cookie sesi. Endpoint login tidak
// boleh lewat sini (harus lewat /api/auth/* yang menyimpan cookie).
const BLOCKED = [/^auth\/(?!me$)/, /^payments\/midtrans\//, /^media\/local\//];

async function forward(request: NextRequest, ctx: RouteContext<'/api/backend/[...path]'>) {
  const { path } = await ctx.params;
  const target = path.join('/');
  if (BLOCKED.some((re) => re.test(target))) return NextResponse.json({ message: 'Tidak ditemukan' }, { status: 404 });

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const res = await fetch(`${API_URL}/${target}${request.nextUrl.search}`, {
    method: request.method,
    headers: {
      ...(hasBody ? { 'Content-Type': request.headers.get('content-type') ?? 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: hasBody ? await request.text() : undefined,
    cache: 'no-store',
  });

  const text = res.status === 204 ? '' : await res.text();
  const response = new NextResponse(text || null, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
  // Token kedaluwarsa/tidak valid: bersihkan cookie supaya UI langsung menganggap belum login.
  if (res.status === 401 && token) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export {
  forward as GET,
  forward as POST,
  forward as PATCH,
  forward as PUT,
  forward as DELETE,
};
