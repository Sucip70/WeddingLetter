import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service.js';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('tier') tier?: string) {
    return this.templatesService.findPublished({
      category,
      tier: tier as 'BASIC' | 'STANDARD' | 'PREMIUM' | undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templatesService.findOne(id);
    if (!template) {
      throw new NotFoundException(`Template ${id} tidak ditemukan`);
    }
    return template;
  }
}
