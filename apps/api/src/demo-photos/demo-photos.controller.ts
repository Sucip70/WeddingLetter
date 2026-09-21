import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { parseBody } from '../auth/auth.dto.js';
import { AuthGuard, Roles } from '../auth/auth.guard.js';
import { DemoPhotosService } from './demo-photos.service.js';

const setSchema = z.object({ key: z.string().min(1).max(200) });

// Publik: dipakai halaman katalog/demo untuk menampilkan foto contoh.
@Controller('demo-photos')
export class DemoPhotosPublicController {
  constructor(private readonly photos: DemoPhotosService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  map() {
    return this.photos.publicMap();
  }
}

@Controller('admin/demo-photos')
@UseGuards(AuthGuard)
@Roles('ADMIN')
export class DemoPhotosAdminController {
  constructor(private readonly photos: DemoPhotosService) {}

  @Get()
  list() {
    return this.photos.list();
  }

  @Put(':slot')
  set(@Param('slot') slot: string, @Body() body: unknown) {
    return this.photos.set(slot, parseBody(setSchema, body).key);
  }

  @Post(':slot/reset')
  @HttpCode(200)
  reset(@Param('slot') slot: string) {
    return this.photos.reset(slot);
  }

  @Delete(':slot')
  clear(@Param('slot') slot: string) {
    return this.photos.clear(slot);
  }
}
