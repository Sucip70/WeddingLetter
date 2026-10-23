import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Editor } from '@/components/editor/editor';
import { ApiError } from '@/lib/api';
import { getAddOns, getDemoPhotos, getTemplate } from '@/lib/catalog';
import { getUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Buat undangan' };

export default async function CreatePage({ params, searchParams }: PageProps<'/create/[id]'>) {
  const { id } = await params;
  const sp = await searchParams;
  const palette = typeof sp.palette === 'string' ? sp.palette : undefined;
  const [template, addOns, user, demoPhotos] = await Promise.all([
    getTemplate(id).catch((error) => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    getAddOns(),
    getUser(),
    getDemoPhotos(),
  ]);
  // `key` memastikan state editor bersih saat berpindah template.
  return <Editor key={template.id} template={template} addOns={addOns} initialUser={user} initialPalette={palette} demoPhotos={demoPhotos} />;
}
