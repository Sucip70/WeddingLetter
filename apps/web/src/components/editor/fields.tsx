'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { mb, rupiah } from '@/lib/format';
import { presetToken } from '@/lib/presets';
import type { FieldDef, InvitationData, MediaCharge, MusicPreset } from '@/lib/types';
import { Badge, Button, Field, Input, Select, Textarea, cn } from '../ui';
import { CoverLayoutPicker } from './cover-picker';
import { ACCEPT, LIMITS } from './model';
import type { LocalFile } from './model';

export interface FieldCtx {
  data: InvitationData;
  files: Record<string, LocalFile>;
  charges: Record<string, MediaCharge>;
  weeks: number;
  presets: MusicPreset[];
  songPrice?: number;
  photoPackPrice?: number;
  maxPhotos: number;
  maxVideos: number;
  // Tata letak sampul yang tersedia (kosong = Basic, pemilih disembunyikan).
  coverLayouts: string[];
  errors: Record<string, string>;
  onChange: (section: string, key: string, value: string | string[] | undefined) => void;
  addFiles: (type: 'PHOTO' | 'VIDEO' | 'SONG', files: File[]) => Promise<LocalFile[]>;
  removeFile: (clientId: string) => void;
  setFileWeeks: (clientId: string, weeks: number) => void;
}

function value(ctx: FieldCtx, section: string, key: string) {
  return ctx.data[section]?.[key];
}

function ChargeBadge({ charge }: { charge?: MediaCharge }) {
  if (!charge) return null;
  if (charge.reason === 'pack') return <Badge tone="gold">Paket foto tambahan</Badge>;
  if (charge.included) return <Badge tone="sage">Gratis</Badge>;
  return <Badge tone="gold">Sewa {rupiah(charge.price)}</Badge>;
}

function Thumb({ lf }: { lf: LocalFile }) {
  if (lf.type === 'PHOTO') return <img src={lf.url} alt="" className="h-full w-full object-cover" />;
  if (lf.type === 'VIDEO') return <video src={lf.url} muted preload="metadata" className="h-full w-full object-cover" />;
  return (
    <div className="flex h-full w-full items-center justify-center bg-rose-soft text-rose">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
    </div>
  );
}

function FileRow({ lf, charge, weeks, onRemove, onWeeks, extra }: { lf: LocalFile; charge?: MediaCharge; weeks: number; onRemove: () => void; onWeeks?: (w: number) => void; extra?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-paper p-2.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ivory"><Thumb lf={lf} /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{lf.file.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-soft">{mb(lf.file.size)}</span>
          <ChargeBadge charge={charge} />
          {charge && !charge.included && onWeeks && (
            <label className="flex items-center gap-1 text-xs text-ink-soft">
              tayang
              <Select value={lf.weeks ?? weeks} onChange={(e) => onWeeks(Number(e.target.value))} className="!h-7 !w-auto !px-2 !py-0 text-xs" aria-label="Lama tayang (minggu)">
                {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>{w} minggu</option>
                ))}
              </Select>
            </label>
          )}
        </div>
      </div>
      {extra}
      <button type="button" onClick={onRemove} aria-label={`Hapus ${lf.file.name}`} className="rounded-full p-1.5 text-ink-soft hover:bg-danger-soft hover:text-danger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </li>
  );
}

function DropZone({ type, multiple, onFiles, label, hint, disabled }: { type: 'PHOTO' | 'VIDEO' | 'SONG'; multiple?: boolean; onFiles: (f: File[]) => void; label: string; hint: string; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (!disabled) onFiles([...e.dataTransfer.files]);
  };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn('rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors', over ? 'border-rose bg-rose-soft/50' : 'border-line bg-ivory/50', disabled && 'opacity-50')}
    >
      <input ref={input} type="file" accept={ACCEPT[type].join(',')} multiple={multiple} className="sr-only" disabled={disabled} onChange={(e) => { onFiles([...(e.target.files ?? [])]); e.target.value = ''; }} aria-label={label} />
      <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => input.current?.click()}>{label}</Button>
      <p className="mt-2 text-xs text-ink-soft">{hint}</p>
    </div>
  );
}

function ImageField({ section, field, ctx }: { section: string; field: FieldDef; ctx: FieldCtx }) {
  const current = value(ctx, section, field.key);
  const lf = typeof current === 'string' ? ctx.files[current] : undefined;
  return (
    <Field label={field.label} required={field.required} error={ctx.errors[`${section}.${field.key}`]} group>
      {lf ? (
        <ul>
          <FileRow lf={lf} charge={ctx.charges[lf.clientId]} weeks={ctx.weeks} onRemove={() => { ctx.removeFile(lf.clientId); ctx.onChange(section, field.key, undefined); }} onWeeks={(w) => ctx.setFileWeeks(lf.clientId, w)} />
        </ul>
      ) : (
        <DropZone
          type="PHOTO"
          label="Pilih foto"
          hint="JPG/PNG/WebP · dikompres otomatis agar ringan"
          onFiles={async (files) => {
            const [added] = await ctx.addFiles('PHOTO', files.slice(0, 1));
            if (added) ctx.onChange(section, field.key, added.clientId);
          }}
        />
      )}
    </Field>
  );
}

function GalleryField({ section, field, ctx }: { section: string; field: FieldDef; ctx: FieldCtx }) {
  const ids = (value(ctx, section, field.key) as string[] | undefined) ?? [];
  const set = (next: string[]) => ctx.onChange(section, field.key, next);
  const move = (i: number, d: number) => {
    const next = [...ids];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    set(next);
  };
  return (
    <Field label={field.label} required={field.required} group hint={`${ctx.maxPhotos} foto gratis dalam template${ctx.photoPackPrice ? `; tambahan per paket 5 foto ${rupiah(ctx.photoPackPrice)}` : ''}.`}>
      <div className="space-y-2">
        {ids.length > 0 && (
          <ul className="space-y-2">
            {ids.map((id, i) => {
              const lf = ctx.files[id];
              if (!lf) return null;
              return (
                <FileRow
                  key={id}
                  lf={lf}
                  charge={ctx.charges[id]}
                  weeks={ctx.weeks}
                  onWeeks={(w) => ctx.setFileWeeks(id, w)}
                  onRemove={() => { ctx.removeFile(id); set(ids.filter((x) => x !== id)); }}
                  extra={
                    <div className="flex flex-col">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Naikkan" className="px-1.5 text-xs text-ink-soft hover:text-ink disabled:opacity-25">▲</button>
                      <button type="button" disabled={i === ids.length - 1} onClick={() => move(i, 1)} aria-label="Turunkan" className="px-1.5 text-xs text-ink-soft hover:text-ink disabled:opacity-25">▼</button>
                    </div>
                  }
                />
              );
            })}
          </ul>
        )}
        <DropZone
          type="PHOTO"
          multiple
          label={ids.length ? 'Tambah foto' : 'Pilih foto (bisa banyak)'}
          hint={`${ids.length} foto dipilih · JPG/PNG/WebP · dikompres otomatis`}
          onFiles={async (files) => {
            const added = await ctx.addFiles('PHOTO', files);
            if (added.length) set([...ids, ...added.map((a) => a.clientId)]);
          }}
        />
      </div>
    </Field>
  );
}

function VideosField({ section, field, ctx }: { section: string; field: FieldDef; ctx: FieldCtx }) {
  const ids = (value(ctx, section, field.key) as string[] | undefined) ?? [];
  const set = (next: string[]) => ctx.onChange(section, field.key, next);
  return (
    <Field
      label={field.label}
      required={field.required}
      group
      hint={ctx.maxVideos > 0 ? `${ctx.maxVideos} video (maks. ${LIMITS.includedVideoMb} MB) gratis di template ini. Selebihnya dihitung sewa ukuran × lama tayang.` : `Video dihitung sewa: ukuran (MB) × lama tayang (minggu) × tarif. Maks. ${LIMITS.videoMb} MB per video.`}
    >
      <div className="space-y-2">
        {ids.length > 0 && (
          <ul className="space-y-2">
            {ids.map((id) => {
              const lf = ctx.files[id];
              return lf ? (
                <FileRow key={id} lf={lf} charge={ctx.charges[id]} weeks={ctx.weeks} onWeeks={(w) => ctx.setFileWeeks(id, w)} onRemove={() => { ctx.removeFile(id); set(ids.filter((x) => x !== id)); }} />
              ) : null;
            })}
          </ul>
        )}
        <DropZone
          type="VIDEO"
          multiple
          label="Pilih video"
          hint="MP4 / WebM"
          onFiles={async (files) => {
            const added = await ctx.addFiles('VIDEO', files);
            if (added.length) set([...ids, ...added.map((a) => a.clientId)]);
          }}
        />
      </div>
    </Field>
  );
}

function SongField({ section, field, ctx }: { section: string; field: FieldDef; ctx: FieldCtx }) {
  const current = value(ctx, section, field.key);
  const custom = typeof current === 'string' && !current.startsWith('preset:') ? ctx.files[current] : undefined;
  const choose = (v: string | undefined) => {
    if (custom && v !== custom.clientId) ctx.removeFile(custom.clientId);
    ctx.onChange(section, field.key, v);
  };
  return (
    <Field label={field.label} required={field.required} group>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm has-[:checked]:border-rose has-[:checked]:bg-rose-soft/40">
          <input type="radio" name={`${section}.${field.key}`} checked={!current} onChange={() => choose(undefined)} className="accent-[#b4533c]" />
          Tanpa musik
        </label>
        {ctx.presets.length === 0 && <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-xs text-ink-soft">Belum ada lagu bawaan untuk paket ini. Anda tetap bisa mengunggah lagu sendiri di bawah.</p>}
        {ctx.presets.map((p, i) => (
          <label key={p.id ?? p.url} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm has-[:checked]:border-rose has-[:checked]:bg-rose-soft/40">
            <input type="radio" name={`${section}.${field.key}`} checked={current === presetToken(p, i)} onChange={() => choose(presetToken(p, i))} className="accent-[#b4533c]" />
            <span className="flex-1">{p.name}{p.credit && <span className="block text-[11px] text-ink-soft">{p.credit}</span>}</span>
            <audio src={p.url} controls preload="none" className="h-8 w-40" onClick={(e) => e.stopPropagation()} />
            <Badge tone="sage">Gratis</Badge>
          </label>
        ))}
        {custom ? (
          <ul>
            <FileRow lf={custom} charge={ctx.charges[custom.clientId]} weeks={ctx.weeks} onRemove={() => choose(undefined)} extra={ctx.songPrice ? <Badge tone="gold">+{rupiah(ctx.songPrice)}</Badge> : null} />
          </ul>
        ) : (
          <DropZone
            type="SONG"
            label="Unggah lagu sendiri"
            hint={`MP3 / M4A / AAC / OGG · maks. ${LIMITS.songMb} MB${ctx.songPrice ? ` · +${rupiah(ctx.songPrice)}` : ''}`}
            onFiles={async (files) => {
              const [added] = await ctx.addFiles('SONG', files.slice(0, 1));
              if (added) ctx.onChange(section, field.key, added.clientId);
            }}
          />
        )}
        <p className="text-xs text-ink-soft">Dengan mengunggah lagu sendiri, Anda menyatakan memiliki hak untuk memakainya dan bertanggung jawab atas klaim hak cipta.</p>
      </div>
    </Field>
  );
}

function CoverLayoutField({ section, field, ctx }: { section: string; field: FieldDef; ctx: FieldCtx }) {
  // Basic (daftar kosong) tidak punya pilihan.
  if (ctx.coverLayouts.length === 0) return null;
  const current = value(ctx, section, field.key);
  const has = (s: string, k: string) => {
    const v = value(ctx, s, k);
    return typeof v === 'string' && v !== '';
  };
  return (
    <Field label={field.label} required={field.required} error={ctx.errors[`${section}.${field.key}`]} group hint="Pilih tampilan halaman pertama. Layout berfoto memakai foto sampul di bawah (boleh berbeda dari foto galeri); tanpa foto akan tampil sebagai Ornamen.">
      <CoverLayoutPicker
        name={`${section}.${field.key}`}
        available={ctx.coverLayouts}
        value={typeof current === 'string' ? current : undefined}
        hasPhoto={has('cover', 'foto')}
        hasCoupleOnly={has('mempelai', 'pria_foto') || has('mempelai', 'wanita_foto')}
        onChange={(k) => ctx.onChange(section, field.key, k)}
      />
    </Field>
  );
}

export function FieldInput({ section, field, ctx }: { section: string; field: FieldDef; ctx: FieldCtx }) {
  const v = value(ctx, section, field.key);
  const text = typeof v === 'string' ? v : '';
  const error = ctx.errors[`${section}.${field.key}`];
  const set = (val: string) => ctx.onChange(section, field.key, val);

  switch (field.type) {
    case 'text':
      return (
        <Field label={field.label} required={field.required} error={error} hint={field.maxLength && text.length > field.maxLength * 0.7 ? `${text.length}/${field.maxLength}` : undefined}>
          <Input value={text} onChange={(e) => set(e.target.value)} maxLength={field.maxLength} placeholder={field.placeholder} />
        </Field>
      );
    case 'textarea':
      return (
        <Field label={field.label} required={field.required} error={error} hint={field.maxLength ? `${text.length}/${field.maxLength}` : undefined}>
          <Textarea value={text} onChange={(e) => set(e.target.value)} maxLength={field.maxLength} placeholder={field.placeholder} rows={3} />
        </Field>
      );
    case 'datetime':
      return (
        <Field label={field.label} required={field.required} error={error} hint="Waktu setempat (WIB)">
          <Input type="datetime-local" value={text} onChange={(e) => set(e.target.value)} />
        </Field>
      );
    case 'url':
      return (
        <Field label={field.label} required={field.required} error={error} hint="Tempel link dari Google Maps (Bagikan → Salin link)">
          <Input type="url" value={text} onChange={(e) => set(e.target.value)} placeholder="https://maps.app.goo.gl/…" />
        </Field>
      );
    case 'image':
      return <ImageField section={section} field={field} ctx={ctx} />;
    case 'gallery':
      return <GalleryField section={section} field={field} ctx={ctx} />;
    case 'videos':
      return <VideosField section={section} field={field} ctx={ctx} />;
    case 'song':
      return <SongField section={section} field={field} ctx={ctx} />;
    case 'coverlayout':
      return <CoverLayoutField section={section} field={field} ctx={ctx} />;
  }
}
