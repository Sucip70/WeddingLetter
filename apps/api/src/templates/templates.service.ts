import { Injectable } from '@nestjs/common';
import type { Template, TemplateTier } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MusicService } from '../music/music.service.js';
import { ADDON_SECTIONS, SECTION_REGISTRY, normalizeLayout, withCoverLayouts, withLibrary } from './layout.js';
import type { MusicPreset, SectionDef, TemplateLayout } from './layout.js';
import { designById } from './themes.js';

function designInfo(layout: TemplateLayout) {
  const design = designById(layout.theme.motif) ?? designById(layout.theme.preset);
  return design ? { id: design.id, name: design.name, group: design.group, blurb: design.blurb } : null;
}

// Detail template (lengkap: field per section, seluruh lagu bawaan, palet).
export function toPublicTemplate(t: Template, library: MusicPreset[]) {
  const { layoutSchema, ...rest } = t;
  const layout: TemplateLayout = withCoverLayouts(withLibrary(normalizeLayout(layoutSchema, t.category), library), t.tier);
  return { ...rest, design: designInfo(layout), layout };
}

// Versi ringan untuk katalog (puluhan template): tanpa field & tanpa daftar lagu.
export function toListTemplate(t: Template, library: MusicPreset[]) {
  const { layoutSchema, ...rest } = t;
  const layout = withCoverLayouts(withLibrary(normalizeLayout(layoutSchema, t.category), library), t.tier);
  return {
    ...rest,
    design: designInfo(layout),
    layout: {
      theme: layout.theme,
      sections: layout.sections.map((s) => ({ id: s.id, title: s.title, fields: [] })),
      galeri: layout.galeri,
      musik: { allowed: layout.musik.allowed, presets: [], count: layout.musik.presets.length },
      palettes: layout.palettes,
      coverLayouts: layout.coverLayouts,
      coverDefault: layout.coverDefault,
    },
  };
}

// Definisi section yang dibuka add-on (RSVP online, amplop digital) untuk template yang belum memilikinya:
// dipakai editor untuk menampilkan form-nya begitu add-on dicentang.
export function addOnSections(): Record<string, SectionDef> {
  const result: Record<string, SectionDef> = {};
  for (const [code, id] of Object.entries(ADDON_SECTIONS)) {
    if (!id) continue;
    const def = SECTION_REGISTRY[id];
    result[code] = { id, title: def.title, fields: def.fields };
  }
  return result;
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly music: MusicService,
  ) {}

  // Katalog publik: hanya template yang sudah published (Bagian 4 & 5).
  async findPublished(params: { category?: string; tier?: TemplateTier }) {
    const rows = await this.prisma.template.findMany({
      where: {
        status: 'PUBLISHED',
        ...(params.category ? { category: params.category } : {}),
        ...(params.tier ? { tier: params.tier } : {}),
      },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
    });
    const library = await this.music.libraryByTier();
    return rows.map((t) => toListTemplate(t, library[t.tier]));
  }

  async findPublishedOne(id: string) {
    const t = await this.prisma.template.findFirst({ where: { id, status: 'PUBLISHED' } });
    return t ? { ...toPublicTemplate(t, await this.music.libraryFor(t.tier)), addOnSections: addOnSections() } : null;
  }
}
