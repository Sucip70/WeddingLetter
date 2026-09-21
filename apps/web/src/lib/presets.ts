import type { MusicPreset } from './types';

// Rujukan lagu bawaan "preset:<token>": token = id lagu pustaka, atau angka = urutan (undangan lama).
export const presetToken = (p: MusicPreset, index: number) => `preset:${p.id ?? index}`;

export function findPreset(presets: MusicPreset[], value: string | undefined): MusicPreset | undefined {
  const m = value ? /^preset:([A-Za-z0-9_-]+)$/.exec(value) : null;
  if (!m) return undefined;
  const token = m[1]!;
  return presets.find((p) => p.id === token) ?? (/^\d+$/.test(token) ? presets[Number(token)] : undefined);
}
