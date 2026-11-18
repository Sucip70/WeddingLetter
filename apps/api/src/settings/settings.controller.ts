import { Body, Controller, Get, Header, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { parseBody } from '../auth/auth.dto.js';
import { AuthGuard, Roles } from '../auth/auth.guard.js';
import { SettingsService } from './settings.service.js';
import { legalSettingsSchema } from './legal-policy.js';

const updateSchema = z.object({ supportWhatsapp: z.string().max(40).optional(), legal: legalSettingsSchema.optional() });

// Publik: footer, beranda, dan dashboard memakai nomor ini untuk tautan bantuan. Kosong = belum ada nomor.
@Controller('settings')
export class SettingsPublicController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  @Header('Cache-Control', 'public, max-age=30')
  async publicSettings() {
    return this.settings.publicSettings();
  }
}

@Controller('admin/settings')
@UseGuards(AuthGuard)
@Roles('ADMIN')
export class SettingsAdminController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  async get() {
    return this.settings.publicSettings();
  }

  @Put()
  update(@Body() body: unknown) {
    return this.settings.update(parseBody(updateSchema, body));
  }
}
