import { defaultCoverLayout } from './cover-layouts';
import type { InvitationViewData, Layout } from './types';

// Isi contoh per key field, dipakai untuk demo template, hero, dan pratinjau builder admin.
const SAMPLE_TEXT: Record<string, string> = {
  pembuka: 'Dengan penuh syukur, kami mengundang Anda untuk hadir dan berbagi kebahagiaan di hari pernikahan kami.',
  pria_nama: 'Andi',
  pria_lengkap: 'Andi Pratama Wijaya',
  pria_ortu: 'Putra dari Bapak Hendra Wijaya & Ibu Ratna Sari',
  wanita_nama: 'Sinta',
  wanita_lengkap: 'Sinta Maharani Putri',
  wanita_ortu: 'Putri dari Bapak Agus Salim & Ibu Dewi Lestari',
  kutipan: 'Di antara sekian banyak pilihan, hatiku memilihmu, hari ini dan selamanya.',
  cerita: 'Kami bertemu di sebuah kedai kopi kecil di Bandung. Dari obrolan singkat tentang buku favorit, tumbuhlah cerita panjang yang kini kami rayakan bersama Anda.',
  akad_lokasi: 'Masjid Al-Ikhlas',
  akad_alamat: 'Jl. Merdeka No. 17, Bandung',
  akad_maps: 'https://maps.google.com',
  resepsi_lokasi: 'Gedung Serbaguna Cahaya',
  resepsi_alamat: 'Jl. Asia Afrika No. 88, Bandung',
  resepsi_maps: 'https://maps.google.com',
  pengantar: '',
  bank_1: 'BCA',
  rekening_1: '1234567890',
  atas_nama_1: 'Andi Pratama',
  bank_2: 'DANA',
  rekening_2: '081234567890',
  atas_nama_2: 'Sinta Maharani',
  alamat_kado: 'Jl. Melati No. 5, Bandung 40111',
};

// Sabtu pertama minimal 45 hari dari sekarang, jam 10.00 (resepsi jam 12.00) — format "YYYY-MM-DDTHH:mm".
function sampleDates() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 45);
  while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  const day = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  return { akad_tanggal: `${day}T10:00`, resepsi_tanggal: `${day}T12:00` };
}

// Foto demo (Admin -> Foto demo): slot -> URL. Dipakai mengisi bingkai mempelai, galeri, dan (opsional) sampul.
export type DemoPhotos = Record<string, string>;
const GALLERY_SLOTS = ['gallery1', 'gallery2', 'gallery3', 'gallery4', 'gallery5', 'gallery6', 'gallery7', 'gallery8'];

// `coverLayout`: tata letak sampul yang diperagakan (bawaan: yang khusus tema / Foto berbingkai). Hanya untuk template yang
// punya pilihan tata letak (Standard & Premium); Basic tetap berornamen walau slot foto sampul terisi.
export function sampleView(layout: Pick<Layout, 'theme' | 'sections' | 'musik'> & { galeri?: Layout['galeri']; coverLayouts?: string[] }, extra: Partial<InvitationViewData> = {}, photos: DemoPhotos = {}, coverLayout?: string): InvitationViewData {
  const dates = sampleDates();
  const data: InvitationViewData['data'] = {};
  for (const section of layout.sections) {
    const values: Record<string, string> = {};
    for (const f of section.fields) {
      if (f.type === 'text' || f.type === 'textarea' || f.type === 'url') {
        if (SAMPLE_TEXT[f.key]) values[f.key] = SAMPLE_TEXT[f.key]!;
      } else if (f.type === 'datetime') {
        const d = dates[f.key as keyof typeof dates];
        if (d) values[f.key] = d;
      }
    }
    if (Object.keys(values).length) data[section.id] = values;
  }
  // Foto demo: hanya untuk field yang memang ada di template.
  const media: InvitationViewData['media'] = {};
  const has = (section: string, key: string) => layout.sections.find((s) => s.id === section)?.fields.some((f) => f.key === key) ?? false;
  const put = (section: string, key: string, slots: string[], list = false) => {
    const ids = slots.filter((slot) => photos[slot]).map((slot) => {
      media[`demo:${slot}`] = { url: photos[slot]!, type: 'PHOTO' };
      return `demo:${slot}`;
    });
    if (!ids.length || !has(section, key)) return;
    data[section] = { ...(data[section] ?? {}), [key]: list ? ids : ids[0]! };
  };
  const coverLayouts = layout.coverLayouts ?? [];
  if (coverLayouts.length > 0 && has('cover', 'tata_letak')) {
    put('cover', 'foto', ['cover']);
    data.cover = { ...(data.cover ?? {}), tata_letak: coverLayout && coverLayouts.includes(coverLayout) ? coverLayout : defaultCoverLayout(coverLayouts) };
  }
  put('mempelai', 'pria_foto', ['groom']);
  put('mempelai', 'wanita_foto', ['bride']);
  put('galeri', 'foto', GALLERY_SLOTS.slice(0, Math.max(0, Math.min(layout.galeri?.maxPhotos ?? 8, 8))), true);

  return {
    slug: 'contoh',
    templateName: 'Contoh',
    layout: { theme: layout.theme, sections: layout.sections, musik: { presets: layout.musik?.presets ?? [] }, coverLayouts },
    features: {},
    data,
    media,
    rsvpEnabled: layout.sections.some((s) => s.id === 'rsvp'),
    guestbook: [],
    ...extra,
  };
}
