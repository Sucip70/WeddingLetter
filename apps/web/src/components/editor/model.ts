import type { FieldDef, InvitationData, SectionDef, TemplateDetail } from '@/lib/types';

// Urutan baku (sama dengan API) untuk menyisipkan section hasil add-on.
const ORDER = ['cover', 'musik', 'mempelai', 'cerita', 'tanggal_lokasi', 'countdown', 'galeri', 'rsvp', 'amplop_digital', 'buku_tamu'];

export const MUSIK_SECTION: SectionDef = {
  id: 'musik',
  title: 'Musik latar',
  fields: [{ key: 'lagu', label: 'Lagu latar', type: 'song', required: false }],
};

export const SELECTABLE = ['RSVP_ONLINE', 'DIGITAL_ENVELOPE', 'TRANSLATION_EN', 'CUSTOM_DOMAIN'] as const;
export type Selectable = (typeof SELECTABLE)[number];

export const LIMITS = { photoMb: 30, videoMb: 500, songMb: 8, includedPhotoMb: 5, includedVideoMb: 20, maxWeeks: 52, maxFiles: 60 };
export const MB = 1024 * 1024;

export const ACCEPT = {
  PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm'],
  SONG: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg'],
} as const;

export interface LocalFile {
  clientId: string;
  file: File;
  url: string;
  type: 'PHOTO' | 'VIDEO' | 'SONG';
  // Lama sewa khusus file ini (hanya berpengaruh untuk media yang kena tarif sewa).
  weeks?: number;
}

export interface Draft {
  data: InvitationData;
  weeks: number;
  addOns: Selectable[];
  couponCode: string;
  customSlug: string;
}

// Section yang benar-benar dipakai = section template + section terbuka oleh add-on + musik bila diizinkan.
export function effectiveSections(template: TemplateDetail, addOns: Selectable[]): SectionDef[] {
  const result = [...template.layout.sections];
  const ensure = (section: SectionDef | undefined) => {
    if (!section || result.some((s) => s.id === section.id)) return;
    const rank = ORDER.indexOf(section.id);
    const at = result.findIndex((s) => ORDER.indexOf(s.id) > rank);
    if (at === -1) result.push(section);
    else result.splice(at, 0, section);
  };
  for (const code of addOns) ensure(template.addOnSections[code]);
  if (template.layout.musik.allowed) ensure(MUSIK_SECTION);
  return result;
}

export function isMediaField(f: FieldDef) {
  return f.type === 'image' || f.type === 'gallery' || f.type === 'videos' || f.type === 'song';
}

// clientId yang benar-benar dirujuk field pada section yang aktif (berurutan, tanpa duplikat).
export function referencedIds(data: InvitationData, sections: SectionDef[]): string[] {
  const ids: string[] = [];
  for (const s of sections) {
    for (const f of s.fields) {
      const v = data[s.id]?.[f.key];
      if (!v) continue;
      if ((f.type === 'image' || f.type === 'song') && typeof v === 'string' && !v.startsWith('preset:')) ids.push(v);
      if ((f.type === 'gallery' || f.type === 'videos') && Array.isArray(v)) ids.push(...v);
    }
  }
  return [...new Set(ids)];
}

// Draft di localStorage tidak menyimpan referensi file (File tidak bisa disimpan).
export function stripMedia(data: InvitationData, sections: SectionDef[]): InvitationData {
  const out: InvitationData = {};
  for (const s of sections) {
    const values: Record<string, string | string[]> = {};
    for (const f of s.fields) {
      const v = data[s.id]?.[f.key];
      if (v === undefined || (isMediaField(f) && !(f.type === 'song' && typeof v === 'string' && v.startsWith('preset:')))) continue;
      values[f.key] = v;
    }
    if (Object.keys(values).length) out[s.id] = values;
  }
  return out;
}

export function setField(data: InvitationData, section: string, key: string, value: string | string[] | undefined): InvitationData {
  const next = { ...(data[section] ?? {}) };
  if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) delete next[key];
  else next[key] = value;
  return { ...data, [section]: next };
}

export function missingRequired(data: InvitationData, sections: SectionDef[]) {
  const missing: { section: string; key: string; label: string }[] = [];
  for (const s of sections) {
    for (const f of s.fields) {
      if (!f.required) continue;
      const v = data[s.id]?.[f.key];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) missing.push({ section: s.id, key: f.key, label: `${s.title} › ${f.label}` });
    }
  }
  return missing;
}

let counter = 0;
export const newClientId = () => `f${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Kompres foto di browser: sisi terpanjang maks 2000px, JPEG kualitas 0,86. Foto ponsel 8–12 MB menjadi
// sekitar 0,5–1,5 MB (tetap tajam untuk undangan) sehingga tetap gratis dalam kuota dan hemat penyimpanan.
export async function compressImage(file: File): Promise<File> {
  if (!ACCEPT.PHOTO.includes(file.type as (typeof ACCEPT.PHOTO)[number])) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * MB) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function fileProblem(file: File, type: 'PHOTO' | 'VIDEO' | 'SONG'): string | null {
  if (!(ACCEPT[type] as readonly string[]).includes(file.type)) {
    return type === 'PHOTO' ? 'Format foto harus JPG, PNG, atau WebP' : type === 'VIDEO' ? 'Format video harus MP4 atau WebM' : 'Format lagu harus MP3, M4A, AAC, atau OGG';
  }
  const limit = type === 'PHOTO' ? LIMITS.photoMb : type === 'VIDEO' ? LIMITS.videoMb : LIMITS.songMb;
  if (file.size > limit * MB) return `${file.name}: maksimal ${limit} MB`;
  return null;
}
