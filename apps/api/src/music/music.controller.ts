import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { parseBody } from '../auth/auth.dto.js';
import { AuthGuard, Roles } from '../auth/auth.guard.js';
import { trackCreateSchema, trackUpdateSchema } from './music.dto.js';
import { MusicService } from './music.service.js';

@Controller('admin/music')
@UseGuards(AuthGuard)
@Roles('ADMIN')
export class MusicController {
  constructor(private readonly music: MusicService) {}

  @Get()
  list() {
    return this.music.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.music.create(parseBody(trackCreateSchema, body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.music.update(id, parseBody(trackUpdateSchema, body));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.music.remove(id);
  }
}
