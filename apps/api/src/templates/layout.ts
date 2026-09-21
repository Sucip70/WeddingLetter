import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ADDON, LIMITS } from '../config/constants.js';
import { DESIGNS, baseColors } from './themes.js';
import type { BodyFont, HeadingFont, Palette } from './themes.js';

// Template engine berbasis skema (Bagian 5): admin menyusun *skema* (section, field, tema, kuota media),
// bukan HTML. Daftar section & field yang dikenali renderer ada di SECTION_REGISTRY; admin hanya
// bisa mengaktifkan/menonaktifkan section & field, mengubah label/wajib-isi, urutan, tema, dan kuota.

export type FieldType = 'text' | 'textarea' | 'datetime' | 'url' | 'image' | 'gallery' | 'videos' | 'song';

export const SECTION_IDS = [
  'cover',
  'musik',
  'mempelai',
  'cerita',
  'tanggal_lokasi',
  'countdown',
  'galeri',
  'rsvp',
  'amplop_digital',
  'buku_tamu',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  maxLength?: number;
  placeholder?: string;
}

export interface SectionDef {
  id: SectionId;
  title: string;
  fields: FieldDef[];
}

export type FxLevel = 'none' | 'standard' | 'premium';
export const FX_LEVELS: FxLevel[] = ['none', 'standard', 'premium'];

export interface ThemeDef {
  // Kunci desain di registry (themes.ts) dan paket motif di web.
  preset: string;
  motif: string;
  // Tingkat animasi: none (Basic), standard (reveal + partikel), premium (efek lengkap).
  fx: FxLevel;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  headingFont: HeadingFont;
  bodyFont: BodyFont;
}

export interface TemplateLayout {
  theme: ThemeDef;
  sections: SectionDef[];
  galeri: { maxPhotos: number; maxVideos: number };
  musik: { allowed: boolean; presets: MusicPreset[] };
  // Pilihan warna yang bisa dipilih pembeli (kosong = tanpa pemilih warna).
  palettes: Palette[];
}

const f = (
  key: string,
  label: string,
  type: FieldType,
  extra: Partial<Pick<FieldDef, 'required' | 'maxLength' | 'placeholder'>> = {},
): FieldDef => ({ key, label, type, required: false, ...extra });

const couple = (who: 'pria' | 'wanita', name: string): FieldDef[] => [
  f(`${who}_nama`, `Nama panggilan ${name}`, 'text', { required: true, maxLength: 40 }),
  f(`${who}_lengkap`, `Nama lengkap ${name}`, 'text', { maxLength: 100 }),
  f(`${who}_ortu`, `Orang tua ${name}`, 'text', { maxLength: 150, placeholder: 'Putra/Putri dari Bapak ... & Ibu ...' }),
  f(`${who}_foto`, `Foto ${name}`, 'image'),
];

const account = (n: number): FieldDef[] => [
  f(`bank_${n}`, `Bank / e-wallet #${n}`, 'text', { maxLength: 40 }),
  f(`rekening_${n}`, `Nomor rekening #${n}`, 'text', { maxLength: 40 }),
  f(`atas_nama_${n}`, `Atas nama #${n}`, 'text', { maxLength: 80 }),
];

export const SECTION_REGISTRY: Record<SectionId, { title: string; fields: FieldDef[] }> = {
  cover: {
    title: 'Sampul',
    fields: [
      f('foto', 'Foto sampul', 'image'),
      f('pembuka', 'Kalimat pembuka', 'textarea', {
        maxLength: 300,
        placeholder: 'Dengan penuh syukur, kami mengundang Anda di hari bahagia kami',
      }),
    ],
  },
  musik: { title: 'Musik latar', fields: [f('lagu', 'Lagu latar', 'song')] },
  mempelai: { title: 'Mempelai', fields: [...couple('pria', 'mempelai pria'), ...couple('wanita', 'mempelai wanita')] },
  cerita: {
    title: 'Cerita kami',
    fields: [f('kutipan', 'Kutipan / doa', 'textarea', { maxLength: 300 }), f('cerita', 'Cerita kami', 'textarea', { maxLength: 1500 })],
  },
  tanggal_lokasi: {
    title: 'Tanggal & lokasi',
    fields: [
      f('akad_tanggal', 'Tanggal & jam akad', 'datetime', { required: true }),
      f('akad_lokasi', 'Tempat akad', 'text', { required: true, maxLength: 120 }),
      f('akad_alamat', 'Alamat akad', 'textarea', { maxLength: 250 }),
      f('akad_maps', 'Link Google Maps akad', 'url'),
      f('resepsi_tanggal', 'Tanggal & jam resepsi', 'datetime'),
      f('resepsi_lokasi', 'Tempat resepsi', 'text', { maxLength: 120 }),
      f('resepsi_alamat', 'Alamat resepsi', 'textarea', { maxLength: 250 }),
      f('resepsi_maps', 'Link Google Maps resepsi', 'url'),
    ],
  },
  countdown: { title: 'Hitung mundur', fields: [] },
  galeri: {
    title: 'Galeri',
    fields: [f('foto', 'Foto galeri', 'gallery'), f('video', 'Video', 'videos')],
  },
  rsvp: { title: 'RSVP', fields: [f('pengantar', 'Teks pengantar RSVP', 'textarea', { maxLength: 200 })] },
  amplop_digital: {
    title: 'Amplop digital',
    fields: [...account(1), ...account(2), f('alamat_kado', 'Alamat pengiriman kado', 'textarea', { maxLength: 250 })],
  },
  buku_tamu: { title: 'Buku tamu', fields: [] },
};

// Urutan baku dipakai saat section hasil add-on disisipkan ke template yang belum punya section itu.
const CANONICAL_ORDER: SectionId[] = [...SECTION_IDS];

// Add-on yang membuka section tambahan di template yang belum menyertakannya.
export const ADDON_SECTIONS: Partial<Record<string, SectionId>> = {
  [ADDON.RSVP_ONLINE]: 'rsvp',
  [ADDON.DIGITAL_ENVELOPE]: 'amplop_digital',
};

// Nilai bawaan tema diturunkan dari registry desain.
const THEMES: Record<string, Pick<ThemeDef, 'primary' | 'secondary' | 'background' | 'text' | 'headingFont' | 'bodyFont'>> = Object.fromEntries(
  DESIGNS.map((x) => [x.id, { ...baseColors(x), headingFont: x.headingFont, bodyFont: x.bodyFont }]),
);
export const THEME_PRESETS = DESIGNS.map((x) => x.id);
export const THEME_DEFINITIONS = THEMES;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna harus format #RRGGBB');

export const paletteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,30}$/, 'ID palet: huruf kecil, angka, tanda hubung'),
  name: z.string().trim().min(1).max(40),
  primary: hex,
  secondary: hex,
  background: hex,
  text: hex,
});

// Lagu bawaan: URL https penuh atau berkas pustaka di web (/audio/<id>.mp3).
// Lagu bawaan. `id` = id trek pustaka (rujukan stabil "preset:<id>"); tanpa id = rujukan berdasarkan urutan (data lama).
export interface MusicPreset {
  id?: string;
  name: string;
  url: string;
  // Kredit yang wajib tampil di undangan (mis. lisensi CC BY).
  credit?: string;
}

const presetUrl = z
  .string()
  .max(500)
  .refine((u) => /^https?:\/\/\S+$/.test(u) || /^\/audio\/[a-z0-9-]+\.mp3$/.test(u), 'URL lagu harus https atau /audio/<nama>.mp3');

const fieldOverride = z.object({
  key: z.string(),
  label: z.string().trim().min(1).max(80).optional(),
  required: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

const sectionInput = z.union([
  z.string(),
  z.object({
    id: z.string(),
    title: z.string().trim().min(1).max(60).optional(),
    enabled: z.boolean().optional(),
    fields: z.array(fieldOverride).optional(),
  }),
]);

// Bentuk yang diterima dari admin / seed lama (section berupa string biasa tetap valid).
export const layoutInputSchema = z.object({
  theme: z
    .object({
      preset: z.string().optional(),
      motif: z.string().max(40).optional(),
      fx: z.enum(['none', 'standard', 'premium']).optional(),
      primary: hex.optional(),
      secondary: hex.optional(),
      background: hex.optional(),
      text: hex.optional(),
      headingFont: z.enum(['script', 'serif', 'sans', 'display', 'cinzel', 'pixel', 'round']).optional(),
      bodyFont: z.enum(['serif', 'sans', 'round']).optional(),
    })
    .optional(),
  palettes: z.array(paletteSchema).max(16).optional(),
  sections: z.array(sectionInput).max(20).optional(),
  galeri: z
    .object({
      maxPhotos: z.number().int().min(0).max(LIMITS.maxMediaPerInvitation).optional(),
      maxVideos: z.number().int().min(0).max(10).optional(),
    })
    .optional(),
  musik: z
    .object({
      allowed: z.boolean().optional(),
      presets: z.array(z.object({ name: z.string().trim().min(1).max(120), url: presetUrl, id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/).optional(), credit: z.string().trim().max(300).optional() })).max(60).optional(),
    })
    .optional(),
  rsvp: z.object({ allowed: z.boolean().optional() }).optional(), // legacy: diabaikan
});

function isSectionId(id: string): id is SectionId {
  return (SECTION_IDS as readonly string[]).includes(id);
}

// Ubah input apa pun (termasuk seed lama) menjadi skema lengkap yang eksplisit. Tidak pernah melempar
// untuk data lama yang "aneh": bagian yang tidak dikenali dibuang.
// Membuang entri section yang bentuknya rusak supaya satu entri buruk tidak menghilangkan sisanya.
function sanitizeRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return {};
  const copy = { ...(raw as Record<string, unknown>) };
  if (Array.isArray(copy.sections)) copy.sections = copy.sections.filter((e) => typeof e === 'string' || (e && typeof e === 'object'));
  return copy;
}

export function normalizeLayout(raw: unknown, category = 'rustic'): TemplateLayout {
  const parsed = layoutInputSchema.safeParse(sanitizeRaw(raw));
  const input = parsed.success ? parsed.data : {};

  const preset = input.theme?.preset && THEMES[input.theme.preset] ? input.theme.preset : THEMES[category] ? category : 'rustic';
  const base = THEMES[preset]!;
  const theme: ThemeDef = {
    preset,
    motif: input.theme?.motif ?? preset,
    fx: input.theme?.fx ?? 'none',
    primary: input.theme?.primary ?? base.primary,
    secondary: input.theme?.secondary ?? base.secondary,
    background: input.theme?.background ?? base.background,
    text: input.theme?.text ?? base.text,
    headingFont: input.theme?.headingFont ?? base.headingFont,
    bodyFont: input.theme?.bodyFont ?? base.bodyFont,
  };

  const sections: SectionDef[] = [];
  for (const entry of input.sections ?? []) {
    const cfg = typeof entry === 'string' ? { id: entry } : entry;
    if (!isSectionId(cfg.id) || cfg.id === 'musik') continue;
    if ('enabled' in cfg && cfg.enabled === false) continue;
    if (sections.some((s) => s.id === cfg.id)) continue;
    sections.push(buildSection(cfg.id, 'title' in cfg ? cfg.title : undefined, 'fields' in cfg ? cfg.fields : undefined));
  }

  const musikAllowed = input.musik?.allowed ?? false;
  return {
    theme,
    sections,
    galeri: { maxPhotos: input.galeri?.maxPhotos ?? 4, maxVideos: input.galeri?.maxVideos ?? 0 },
    musik: { allowed: musikAllowed, presets: input.musik?.presets ?? [] },
    palettes: buildPalettes(theme, input.palettes ?? []),
  };
}

const sameColor = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// Daftar palet selalu memuat warna bawaan template (id "bawaan") bila ada palet tambahan, supaya pembeli bisa kembali ke aslinya.
function buildPalettes(theme: ThemeDef, custom: Palette[]): Palette[] {
  if (custom.length === 0) return [];
  const matchesBase = (p: Palette) =>
    sameColor(p.primary, theme.primary) && sameColor(p.secondary, theme.secondary) && sameColor(p.background, theme.background) && sameColor(p.text, theme.text);
  if (custom.some(matchesBase)) return custom;
  return [{ id: 'bawaan', name: 'Bawaan', primary: theme.primary, secondary: theme.secondary, background: theme.background, text: theme.text }, ...custom];
}

// Menerapkan palet pilihan pembeli ke skema (dipakai saat membuat snapshot undangan).
export function applyPalette(layout: TemplateLayout, paletteId: string | undefined): TemplateLayout {
  if (!paletteId) return layout;
  const p = layout.palettes.find((x) => x.id === paletteId);
  if (!p) throw new BadRequestException('Warna yang dipilih tidak tersedia untuk template ini');
  return { ...layout, theme: { ...layout.theme, primary: p.primary, secondary: p.secondary, background: p.background, text: p.text } };
}

function buildSection(id: SectionId, title?: string, overrides?: z.infer<typeof fieldOverride>[]): SectionDef {
  const def = SECTION_REGISTRY[id];
  const fields: FieldDef[] = [];
  for (const base of def.fields) {
    const o = overrides?.find((x) => x.key === base.key);
    if (o?.enabled === false) continue;
    fields.push({ ...base, label: o?.label ?? base.label, required: o?.required ?? base.required });
  }
  return { id, title: title ?? def.title, fields };
}

// Section yang benar-benar dipakai sebuah undangan = section template + section hasil add-on (+ musik bila diizinkan).
export function effectiveSections(layout: TemplateLayout, features: { rsvp?: boolean; envelope?: boolean }): SectionDef[] {
  const result = [...layout.sections];
  const ensure = (id: SectionId) => {
    if (result.some((s) => s.id === id)) return;
    const rank = CANONICAL_ORDER.indexOf(id);
    const at = result.findIndex((s) => CANONICAL_ORDER.indexOf(s.id) > rank);
    const section = buildSection(id);
    if (at === -1) result.push(section);
    else result.splice(at, 0, section);
  };
  if (features.rsvp) ensure('rsvp');
  if (features.envelope) ensure('amplop_digital');
  if (layout.musik.allowed) ensure('musik');
  return result;
}

// Rujukan lagu bawaan "preset:<token>": token = id preset, atau angka = urutan (undangan lama sebelum ada id).
export function findPreset(presets: MusicPreset[], token: string): MusicPreset | undefined {
  const byId = presets.find((p) => p.id === token);
  if (byId) return byId;
  return /^\d+$/.test(token) ? presets[Number(token)] : undefined;
}

// Menggabungkan lagu pustaka (yang berhak dipakai paket ini) ke skema template. Lagu khusus template
// (unggahan admin di builder) diberi id stabil "c<urutan>" dan ditaruh setelah lagu pustaka.
// Template tanpa musik (allowed=false) tidak diubah.
export function withLibrary(layout: TemplateLayout, library: MusicPreset[]): TemplateLayout {
  if (!layout.musik.allowed) return layout;
  const own = layout.musik.presets.map((p, i) => ({ ...p, id: p.id ?? `c${i}` }));
  const seen = new Set<string>();
  const presets = [...library, ...own].filter((p) => (seen.has(p.id!) ? false : (seen.add(p.id!), true)));
  return { ...layout, musik: { ...layout.musik, presets } };
}

export function layoutIncludes(layout: TemplateLayout, id: SectionId) {
  return layout.sections.some((s) => s.id === id);
}

export interface InvitationFeatures {
  rsvp?: boolean;
  envelope?: boolean;
  english?: boolean;
  // Id palet warna pilihan pembeli.
  palette?: string;
}

export type InvitationData = Record<string, Record<string, string | string[]>>;

export interface ValidatedData {
  data: InvitationData;
  // Semua id media yang dirujuk field bertipe image/gallery/videos/song (belum diverifikasi kepemilikannya).
  mediaRefs: { photos: string[]; galleryPhotos: string[]; videos: string[]; songs: string[] };
}

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Validasi isi undangan terhadap skema. `resolveMediaRef` memetakan nilai mentah (mis. clientId dari
// browser) ke id media final; nilai `preset:N` untuk lagu dipertahankan apa adanya.
// `lenient` (untuk kalkulator harga saat user masih mengetik): tidak melempar error, field yang
// kosong/tidak valid dilewati saja.
export function validateInvitationData(
  sections: SectionDef[],
  layout: TemplateLayout,
  input: unknown,
  resolveMediaRef: (raw: string) => string = (x) => x,
  options: { lenient?: boolean } = {},
): ValidatedData {
  const errors: string[] = [];
  const err = (message: string) => {
    if (!options.lenient) errors.push(message);
  };
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const data: InvitationData = {};
  const refs: ValidatedData['mediaRefs'] = { photos: [], galleryPhotos: [], videos: [], songs: [] };

  for (const section of sections) {
    const rawSection = src[section.id];
    const rs = (rawSection && typeof rawSection === 'object' ? rawSection : {}) as Record<string, unknown>;
    const out: Record<string, string | string[]> = {};

    for (const field of section.fields) {
      const value = rs[field.key];
      const label = `${section.title} › ${field.label}`;
      const isEmpty =
        value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        if (field.required) err(`${label} wajib diisi`);
        continue;
      }

      switch (field.type) {
        case 'text':
        case 'textarea': {
          if (typeof value !== 'string') {
            err(`${label} harus berupa teks`);
            break;
          }
          const text = value.trim();
          const max = field.maxLength ?? (field.type === 'text' ? 200 : 1000);
          if (text.length > max) err(`${label} maksimal ${max} karakter`);
          else out[field.key] = text;
          break;
        }
        case 'datetime': {
          if (typeof value !== 'string' || !LOCAL_DATETIME.test(value) || Number.isNaN(Date.parse(`${value}:00Z`))) {
            err(`${label} harus berformat tanggal & jam yang valid`);
          } else out[field.key] = value; // waktu setempat (WIB), disimpan apa adanya
          break;
        }
        case 'url': {
          try {
            if (typeof value !== 'string' || value.length > 500) throw new Error();
            const url = new URL(value);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
            out[field.key] = url.toString();
          } catch {
            err(`${label} harus berupa link http(s) yang valid`);
          }
          break;
        }
        case 'image': {
          if (typeof value !== 'string') {
            err(`${label} tidak valid`);
            break;
          }
          const id = resolveMediaRef(value);
          out[field.key] = id;
          refs.photos.push(id);
          break;
        }
        case 'song': {
          if (typeof value !== 'string') {
            err(`${label} tidak valid`);
            break;
          }
          const m = /^preset:([A-Za-z0-9_-]{1,40})$/.exec(value);
          if (m) {
            if (!findPreset(layout.musik.presets, m[1]!)) err(`${label}: lagu bawaan tidak ditemukan`);
            else out[field.key] = value;
          } else {
            const id = resolveMediaRef(value);
            out[field.key] = id;
            refs.songs.push(id);
          }
          break;
        }
        case 'gallery':
        case 'videos': {
          if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
            err(`${label} tidak valid`);
            break;
          }
          const ids = [...new Set((value as string[]).map(resolveMediaRef))];
          if (ids.length > LIMITS.maxMediaPerInvitation) {
            err(`${label} terlalu banyak file`);
            break;
          }
          out[field.key] = ids;
          if (field.type === 'gallery') {
            refs.galleryPhotos.push(...ids);
            refs.photos.push(...ids);
          } else refs.videos.push(...ids);
          break;
        }
      }
    }
    if (Object.keys(out).length) data[section.id] = out;
  }

  if (errors.length) throw new BadRequestException(errors.join('; '));
  return { data, mediaRefs: refs };
}

export interface AuthoringField {
  key: string;
  type: FieldType;
  label: string;
  required: boolean;
  enabled: boolean;
}
export interface AuthoringSection {
  id: SectionId;
  title: string;
  enabled: boolean;
  fields: AuthoringField[];
}

// Bentuk lengkap untuk template builder admin: SEMUA section yang dikenali renderer (yang aktif lebih
// dulu, sesuai urutan tersimpan), lengkap dengan flag aktif/wajib per field. Round-trip dengan
// `layoutInputSchema` (yang sama dipakai saat menyimpan).
export function toAuthoring(raw: unknown, category = 'rustic') {
  const parsed = layoutInputSchema.safeParse(sanitizeRaw(raw));
  const input = parsed.success ? parsed.data : {};
  const norm = normalizeLayout(raw, category);
  const enabledIds = norm.sections.map((s) => s.id);
  const order: SectionId[] = [
    ...enabledIds,
    ...SECTION_IDS.filter((id) => id !== 'musik' && !enabledIds.includes(id)),
  ];

  const sections: AuthoringSection[] = order.map((id) => {
    const def = SECTION_REGISTRY[id];
    const entry = (input.sections ?? []).find((e) => (typeof e === 'string' ? e : e.id) === id);
    const cfg = typeof entry === 'object' ? entry : undefined;
    return {
      id,
      title: cfg?.title ?? def.title,
      enabled: enabledIds.includes(id),
      fields: def.fields.map((base) => {
        const o = cfg?.fields?.find((x) => x.key === base.key);
        return { key: base.key, type: base.type, label: o?.label ?? base.label, required: o?.required ?? base.required, enabled: o?.enabled ?? true };
      }),
    };
  });
  // Palet mentah (tanpa "bawaan" otomatis) supaya round-trip dengan builder tidak menyimpan entri turunan.
  return { theme: norm.theme, sections, galeri: norm.galeri, musik: norm.musik, palettes: input.palettes ?? [] };
}
