import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const WHATSAPP_KEY = 'support_whatsapp';

// Nomor WhatsApp dalam format internasional tanpa tanda baca (62812…). Menerima "0812-3456-7890", "+62 812 …", atau kosong
// (= belum ada nomor; web menampilkan halaman "segera hadir" alih-alih tautan WhatsApp).
export function normalizeWhatsapp(input: string): string {
  const raw = input.trim();
  if (!raw) return '';
  if (!/^[+\d][\d\s().-]*$/.test(raw)) throw new BadRequestException('Nomor WhatsApp hanya boleh berisi angka, spasi, +, atau tanda hubung');
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (digits.length < 9 || digits.length > 15) throw new BadRequestException('Nomor WhatsApp tidak valid (9-15 digit, contoh 6281234567890)');
  return digits;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async supportWhatsapp(): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key: WHATSAPP_KEY } });
    return row?.value ?? '';
  }

  async setSupportWhatsapp(input: string) {
    const value = normalizeWhatsapp(input);
    if (!value) {
      await this.prisma.setting.deleteMany({ where: { key: WHATSAPP_KEY } });
    } else {
      await this.prisma.setting.upsert({ where: { key: WHATSAPP_KEY }, create: { key: WHATSAPP_KEY, value }, update: { value } });
    }
    return { supportWhatsapp: value };
  }
}
