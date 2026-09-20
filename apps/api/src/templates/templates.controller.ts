import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { TemplateTier } from '../generated/prisma/client.js';
import { TemplatesService } from './templates.service.js';

const TIERS: TemplateTier[] = ['BASIC', 'STANDARD', 'PREMIUM'];

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('tier') tier?: string) {
    return this.templatesService.findPublished({
      category: category || undefined,
      tier: TIERS.find((t) => t === tier?.toUpperCase()),
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templatesService.findPublishedOne(id);
    if (!template) throw new NotFoundException(`Template ${id} tidak ditemukan`);
    return template;
  }
}
