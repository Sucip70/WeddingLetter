import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { scannedGuestToken } from './guest-list';

describe('guest QR encoding and scanning', () => {
  it('reads the exact personal token back from the generated QR image', () => {
    const token = 'f'.repeat(64);
    const value = `https://weddingletter.id/u/example?guest=${token}`;
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const scale = 4;
    const width = (qr.modules.size + 8) * scale;
    const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
    for (let y = 0; y < qr.modules.size; y++) for (let x = 0; x < qr.modules.size; x++) {
      if (!qr.modules.get(y, x)) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const offset = (((y + 4) * scale + dy) * width + (x + 4) * scale + dx) * 4;
        pixels[offset] = 0; pixels[offset + 1] = 0; pixels[offset + 2] = 0;
      }
    }
    const decoded = jsQR(pixels, width, width);
    expect(decoded?.data).toBe(value);
    expect(scannedGuestToken(decoded!.data)).toBe(token);
  });
});
