import type { Metadata } from 'next';
import { Badge, LinkButton } from '@/components/ui';
import { contactHref, getSupportWhatsapp } from '@/lib/contact';

export const metadata: Metadata = { title: 'Hubungi kami' };

// Tujuan semua tautan bantuan selama nomor WhatsApp belum diisi admin (Admin -> Pengaturan).
export default async function ContactPage() {
  const wa = await getSupportWhatsapp();
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      {wa ? (
        <>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Hubungi kami</h1>
          <p className="mt-4 leading-relaxed text-ink-soft">Tanya soal template, harga, refund, atau pesan desain custom lewat WhatsApp.</p>
          <div className="mt-8">
            <LinkButton href={contactHref('Halo WeddingLetter, saya ingin bertanya tentang undangan digital.', wa)} external size="lg">
              Chat WhatsApp
            </LinkButton>
          </div>
        </>
      ) : (
        <>
          <Badge tone="rose">Segera hadir</Badge>
          <h1 className="mt-5 font-display text-3xl text-ink sm:text-4xl">Layanan bantuan belum dibuka</h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Kami sedang menyiapkan jalur bantuan dan pemesanan desain custom. Sementara itu, Anda tetap bisa memilih template dan membuat undangan sendiri. Harga dan total biaya terlihat sebelum Anda bayar.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/templates" size="lg">Lihat template</LinkButton>
            <LinkButton href="/" variant="secondary" size="lg">Kembali ke beranda</LinkButton>
          </div>
        </>
      )}
    </div>
  );
}
