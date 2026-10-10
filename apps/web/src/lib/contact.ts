import { apiFetch } from './api';
import { whatsappLink } from './format';

// Nomor WhatsApp bantuan diatur admin di Admin -> Pengaturan (disimpan di database). Kosong = belum ada nomor.
export const getSupportWhatsapp = () =>
  apiFetch<{ supportWhatsapp: string }>('/settings/public', { next: { revalidate: 30 }, cache: 'force-cache' } as RequestInit)
    .then((r) => r.supportWhatsapp)
    .catch(() => '');

// Tautan bantuan: WhatsApp bila nomor sudah diisi, kalau belum ke halaman /kontak ("segera hadir").
export function contactHref(message: string, number: string) {
  return number ? whatsappLink(message, number) : '/kontak';
}
