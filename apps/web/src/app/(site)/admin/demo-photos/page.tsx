import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { authedFetch } from '@/lib/session';
import { DemoPhotosManager } from './demo-photos-manager';

export const metadata: Metadata = { title: 'Admin — foto demo' };

export interface DemoSlotRow {
  slot: string;
  label: string;
  hint: string;
  hasDefault: boolean;
  url: string | null;
  isDefault: boolean;
}

export default async function AdminDemoPhotos() {
  const slots = await authedFetch<DemoSlotRow[]>('/admin/demo-photos', '/admin/demo-photos');
  return (
    <>
      <PageHeader
        title="Foto demo"
        subtitle="Foto contoh yang tampil di demo template (halaman detail, beranda, dan pratinjau builder) supaya template terlihat hidup. Ganti dengan foto Anda sendiri kapan saja; semua template ikut berubah."
      />
      <DemoPhotosManager initial={slots} />
    </>
  );
}
