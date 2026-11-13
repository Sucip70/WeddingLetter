import { BadRequestException } from '@nestjs/common';
import { normalizeWhatsapp } from './settings.service.js';

describe('normalizeWhatsapp', () => {
  it('kosong tetap kosong (belum ada nomor)', () => {
    expect(normalizeWhatsapp('')).toBe('');
    expect(normalizeWhatsapp('   ')).toBe('');
  });

  it('menormalkan berbagai penulisan ke format 62…', () => {
    expect(normalizeWhatsapp('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsapp('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsapp('6281234567890')).toBe('6281234567890');
  });

  it('menolak huruf dan nomor yang terlalu pendek/panjang', () => {
    expect(() => normalizeWhatsapp('abc')).toThrow(BadRequestException);
    expect(() => normalizeWhatsapp('0812')).toThrow(BadRequestException);
    expect(() => normalizeWhatsapp('1'.repeat(16))).toThrow(BadRequestException);
  });
});
