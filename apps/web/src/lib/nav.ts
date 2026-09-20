// Hanya izinkan tujuan internal (cegah open redirect lewat ?next=).
export function safeNext(value: string | string[] | undefined, fallback = '/dashboard') {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : fallback;
}
