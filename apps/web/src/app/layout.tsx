import type { Metadata } from 'next';
import { Cormorant_Garamond, Fraunces, Great_Vibes, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], display: 'swap' });
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' });
const script = Great_Vibes({ variable: '--font-script', subsets: ['latin'], weight: '400', display: 'swap' });
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'WeddingLetter — Undangan pernikahan digital', template: '%s · WeddingLetter' },
  description: 'Buat undangan pernikahan digital yang cantik sendiri dari template mulai Rp20.000, dengan harga transparan. Atau pesan desain custom.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${fraunces.variable} ${script.variable} ${cormorant.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
