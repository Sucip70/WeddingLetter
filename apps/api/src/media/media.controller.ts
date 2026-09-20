import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { parseBody } from '../auth/auth.dto.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { MediaService, replaceSchema } from './media.service.js';

@Controller('media')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post(':id/presign')
  @HttpCode(200)
  presign(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.media.presign(user.id, id);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.media.confirm(user.id, id);
  }

  // Mengganti file undangan yang sudah dibeli (tanpa biaya tambahan). Lanjutkan dengan upload + confirm.
  @Post(':id/replace')
  @HttpCode(200)
  replace(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.media.replace(user.id, id, parseBody(replaceSchema, body));
  }
}
