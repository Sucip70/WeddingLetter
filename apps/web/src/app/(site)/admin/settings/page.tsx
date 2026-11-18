import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { authedFetch } from '@/lib/session';
import { SettingsForm } from './settings-form';
import type { PublicSettings } from '@/lib/legal';

export const metadata: Metadata = { title: 'Admin — pengaturan' };

export default async function AdminSettings() {
  const settings = await authedFetch<PublicSettings>('/admin/settings', '/admin/settings');
  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Pengaturan situs yang bisa diubah tanpa deploy ulang." />
      <SettingsForm initial={settings} />
    </>
  );
}
