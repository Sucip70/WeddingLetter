'use client';

import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { PusakoLetterGate } from './pusako-letter-gate';

export function hasPusakoGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'pusako-minang' && artwork?.designId === 'pusako-minang' && !!(
    artwork.assets.gateBackground && artwork.assets.gateTransition && artwork.assets.gateForeground && artwork.assets.gateInteractive
  );
}

/** Approved Surat Bersegel gate; the original invitation covers and content remain unchanged. */
export function PusakoGate({ artwork, phase, names, kicker, guest, cta, previewState, dateText, onOpen }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
  dateText?: string;
  onOpen?: () => void;
}) {
  return <PusakoLetterGate artwork={artwork} phase={phase} names={names} kicker={kicker} guest={guest} cta={cta} dateText={dateText} onOpen={onOpen} previewState={previewState} />;
}
