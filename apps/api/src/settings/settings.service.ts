import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildLegalPolicy, LEGAL_DEFAULTS, legalSettingsSchema, type LegalSettings } from './legal-policy.js';

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
    return row?.value ?? '6282125622542';
  }

  async legalSettings(): Promise<LegalSettings> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'legal_settings' } });
    if (!row) return { ...LEGAL_DEFAULTS };
    return legalSettingsSchema.parse(JSON.parse(row.value));
  }

  async publicSettings() {
    const [supportWhatsapp, legal] = await Promise.all([this.supportWhatsapp(), this.legalSettings()]);
    return { supportWhatsapp, legal, policy: buildLegalPolicy(legal, supportWhatsapp) };
  }

  async update(input: { supportWhatsapp?: string; legal?: LegalSettings }) {
    const writes = [];
    if (input.supportWhatsapp !== undefined) {
      const value = normalizeWhatsapp(input.supportWhatsapp);
      writes.push(this.prisma.setting.upsert({ where: { key: WHATSAPP_KEY }, create: { key: WHATSAPP_KEY, value }, update: { value } }));
    }
    if (input.legal) {
      const value = JSON.stringify(legalSettingsSchema.parse(input.legal));
      writes.push(this.prisma.setting.upsert({ where: { key: 'legal_settings' }, create: { key: 'legal_settings', value }, update: { value } }));
    }
    await this.prisma.$transaction(writes);
    return this.publicSettings();
  }

  async setSupportWhatsapp(input: string) {
    return this.update({ supportWhatsapp: input });
  }
}
