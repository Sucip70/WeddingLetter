import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  // Katalog publik: hanya template yang sudah published (Bagian 4 & 5).
  findPublished(params: { category?: string; tier?: Prisma.TemplateWhereInput['tier'] }) {
    return this.prisma.template.findMany({
      where: {
        status: 'PUBLISHED',
        ...(params.category ? { category: params.category } : {}),
        ...(params.tier ? { tier: params.tier } : {}),
      },
      orderBy: { price: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.template.findUnique({ where: { id } });
  }
}
