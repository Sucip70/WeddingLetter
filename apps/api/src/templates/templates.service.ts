import { Injectable } from '@nestjs/common';
import type { Template, TemplateTier } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ADDON_SECTIONS, SECTION_REGISTRY, normalizeLayout } from './layout.js';
import type { SectionDef, TemplateLayout } from './layout.js';

export function toPublicTemplate(t: Template) {
  const { layoutSchema, ...rest } = t;
  const layout: TemplateLayout = normalizeLayout(layoutSchema, t.category);
  return { ...rest, layout };
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
  constructor(private readonly prisma: PrismaService) {}

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
    return rows.map(toPublicTemplate);
  }

  async findPublishedOne(id: string) {
    const t = await this.prisma.template.findFirst({ where: { id, status: 'PUBLISHED' } });
    return t ? { ...toPublicTemplate(t), addOnSections: addOnSections() } : null;
  }
}
