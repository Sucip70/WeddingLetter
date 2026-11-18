import type { Metadata } from 'next';
import { LinkButton } from '@/components/ui';
import { contactHref } from '@/lib/contact';
import { apiFetch } from '@/lib/api';
import type { PublicSettings } from '@/lib/legal';

export const metadata: Metadata = { title: 'Hubungi kami' };

export default async function ContactPage() {
  const { supportWhatsapp: wa, legal } = await apiFetch<PublicSettings>('/settings/public');
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Hubungi kami</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">Tanya soal template, harga, refund, atau pesan desain custom melalui layanan bantuan WeddingLetter.</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">Dikelola oleh <a href={legal.ownerUrl} target="_blank" rel="noopener noreferrer" className="underline">{legal.ownerName}</a>.<br />{legal.serviceHours}<br />Target respons awal paling lambat {legal.responseBusinessDays} hari kerja.</p>
      <a href={`mailto:${legal.supportEmail}`} className="mt-3 inline-block text-sm text-rose underline">{legal.supportEmail}</a>
      {wa && <div className="mt-8">
        <LinkButton href={contactHref('Halo WeddingLetter, saya ingin bertanya tentang undangan digital.', wa)} external size="lg">Chat WhatsApp</LinkButton>
      </div>}
    </div>
  );
}
