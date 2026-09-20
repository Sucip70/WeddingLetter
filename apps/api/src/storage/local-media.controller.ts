import { createWriteStream } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { KEY_PATTERN } from './local.driver.js';
import { StorageService } from './storage.service.js';

// Khusus development tanpa R2: menerima upload (URL bertanda tangan) dan menyajikan file dari disk.
// Di production dengan R2 terkonfigurasi, controller ini selalu 404.
@Controller('media/local')
export class LocalMediaController {
  constructor(private readonly storage: StorageService) {}

  @Put(':inv/:file')
  async upload(
    @Param('inv') inv: string,
    @Param('file') file: string,
    @Query() query: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const local = this.storage.local;
    if (!local) throw new NotFoundException();
    const key = `${inv}/${file}`;
    if (!KEY_PATTERN.test(key)) throw new BadRequestException('Kunci tidak valid');

    const size = Number(query.size);
    const exp = Number(query.exp);
    if (!local.verify(key, query.ct ?? '', size, exp, query.sig ?? '')) {
      throw new ForbiddenException('URL upload tidak valid atau sudah kedaluwarsa');
    }
    if (req.headers['content-type'] !== query.ct) throw new BadRequestException('Content-Type tidak sesuai');

    await local.ensureDir(key);
    const target = local.filePath(key);
    const temp = `${target}.part`;
    let received = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        received += chunk.length;
        if (received > size) cb(new Error('too-large'));
        else cb(null, chunk);
      },
    });

    try {
      await pipeline(req, counter, createWriteStream(temp));
    } catch (error) {
      await rm(temp, { force: true });
      if ((error as Error).message === 'too-large') throw new BadRequestException('File lebih besar dari yang dideklarasikan');
      throw error;
    }
    if (received !== size) {
      await rm(temp, { force: true });
      throw new BadRequestException('Ukuran file tidak sesuai dengan yang dideklarasikan');
    }
    await rename(temp, target);
    res.status(200).json({ ok: true });
  }

  @Get(':inv/:file')
  download(@Param('inv') inv: string, @Param('file') file: string, @Res() res: Response) {
    const local = this.storage.local;
    if (!local) throw new NotFoundException();
    const key = `${inv}/${file}`;
    if (!KEY_PATTERN.test(key)) throw new NotFoundException();
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(local.filePath(key), (err) => {
      if (err && !res.headersSent) res.status(404).json({ statusCode: 404, message: 'File tidak ditemukan' });
    });
  }
}
