import { describe, expect, it } from 'vitest';
import { guestLink, guestPhone, scannedGuestToken } from './guest-list';
describe('guest personal links and QR', () => {
  const token = 'a'.repeat(64);
  it('does not place names or phone numbers into QR URLs', () => {
    const link = guestLink('https://weddingletter.id/u/example?to=Budi', token);
    expect(link).not.toContain('Budi'); expect(scannedGuestToken(link)).toBe(token);
  });
  it('accepts a token or personal URL and rejects unrelated payloads', () => {
    expect(scannedGuestToken(token)).toBe(token);
    for (const text of ['not-a-qr', 'https://example.com/u/wrong', '<script>alert(1)</script>', 'a'.repeat(63)]) expect(scannedGuestToken(text)).toBeNull();
  });
  it('normalizes Indonesian and international WhatsApp numbers', () => {
    expect(guestPhone('0812-345')).toBe('62812345'); expect(guestPhone('+6012345')).toBe('6012345'); expect(guestPhone(null)).toBe('');
  });
});
