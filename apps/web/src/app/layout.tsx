import type { Metadata } from 'next';
import { Cinzel, Cormorant_Garamond, Fraunces, Fredoka, Great_Vibes, Montserrat, Noto_Sans_Javanese, Plus_Jakarta_Sans, Playfair_Display, Press_Start_2P } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], display: 'swap' });
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' });
const script = Great_Vibes({ variable: '--font-script', subsets: ['latin'], weight: '400', display: 'swap' });
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });
// Font khusus tema undangan: baru diunduh browser saat ada undangan yang memakainya (preload dimatikan).
const cinzel = Cinzel({ variable: '--font-cinzel', subsets: ['latin'], weight: ['500', '700'], display: 'swap', preload: false });
const pixel = Press_Start_2P({ variable: '--font-pixel', subsets: ['latin'], weight: '400', display: 'swap', preload: false });
const fredoka = Fredoka({ variable: '--font-fredoka', subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', preload: false });
// Batik Jawa (keraton): judul Playfair Display, isi Montserrat, aksara Jawa dekoratif Noto Sans Javanese.
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], display: 'swap', preload: false });
const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', preload: false });
const javanese = Noto_Sans_Javanese({ variable: '--font-javanese', subsets: ['javanese'], weight: ['400', '700'], display: 'swap', preload: false });

export const metadata: Metadata = {
  title: { default: 'WeddingLetter — Undangan pernikahan digital', template: '%s · WeddingLetter' },
  description: 'Buat undangan pernikahan digital yang cantik sendiri dari template mulai Rp20.000, dengan harga transparan. Atau pesan desain custom.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${fraunces.variable} ${script.variable} ${cormorant.variable} ${cinzel.variable} ${pixel.variable} ${fredoka.variable} ${playfair.variable} ${montserrat.variable} ${javanese.variable} h-full`} data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Ekstensi browser (pengelola sandi, terjemahan, dsb.) sering menambah atribut ke <html>/<body> sebelum React aktif. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
