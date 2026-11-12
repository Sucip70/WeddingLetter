export interface InvitedGuest {
  id: string; name: string; phone: string | null; partySize: number; token: string;
  sharedAt: string | null; lastCopiedAt: string | null; lastWhatsappOpenedAt: string | null;
  checkedInAt: string | null; checkedInCount: number;
}
export function guestLink(base: string, token: string): string {
  const url = new URL(base);
  url.searchParams.delete('to');
  url.searchParams.set('guest', token);
  return url.toString();
}
export function scannedGuestToken(value: string): string | null {
  const input = value.trim();
  if (/^[a-f0-9]{64}$/.test(input)) return input;
  try { const token = new URL(input).searchParams.get('guest'); return token && /^[a-f0-9]{64}$/.test(token) ? token : null; }
  catch { return null; }
}
export function guestPhone(phone: string | null) {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}
