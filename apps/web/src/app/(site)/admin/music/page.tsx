import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { authedFetch } from '@/lib/session';
import { MusicManager } from './music-manager';

export const metadata: Metadata = { title: 'Admin — musik' };

export type LicenseType = 'PUBLIC_DOMAIN' | 'CC0' | 'ROYALTY_FREE' | 'CC_BY' | 'OTHER';
export type TrackTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface AdminTrack {
  id: string;
  title: string;
  artist: string;
  licenseType: LicenseType;
  licenseNote: string | null;
  sourceUrl: string | null;
  attribution: string | null;
  minTier: TrackTier;
  sizeBytes: number;
  durationSec: number | null;
  sortOrder: number;
  status: 'ACTIVE' | 'ARCHIVED';
  url: string;
}

export default async function AdminMusic() {
  const tracks = await authedFetch<AdminTrack[]>('/admin/music', '/admin/music');
  return (
    <>
      <PageHeader
        title="Musik"
        subtitle="Pustaka lagu bawaan untuk semua template. Lagu klasik domain publik untuk semua paket; lagu royalty-free dari library untuk Standard & Premium. Unggah, atur paket yang boleh memakainya, dan catat lisensinya."
      />
      <MusicManager initial={tracks} />
    </>
  );
}
