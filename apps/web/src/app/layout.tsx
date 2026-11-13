import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Font di-host sendiri (src/app/fonts, woff2 subset latin; dibuat scripts/fetch-fonts.mjs) alih-alih next/font/google:
// build Docker staging gagal saat Next mengunduh Google Fonts ("next/font/google queries have exactly one entry"),
// jadi build tidak boleh bergantung pada jaringan ke Google. Hampir semua font berupa variable font (satu berkas per gaya).
const jakarta = localFont({ variable: '--font-jakarta', src: [{ path: './fonts/jakarta-normal-0.woff2', weight: '200 800', style: 'normal' }], display: 'swap' });
const fraunces = localFont({ variable: '--font-fraunces', src: [{ path: './fonts/fraunces-normal-0.woff2', weight: '100 900', style: 'normal' }], display: 'swap' });
const script = localFont({ variable: '--font-script', src: [{ path: './fonts/script-normal-0.woff2', weight: '400', style: 'normal' }], display: 'swap' });
const cormorant = localFont({ variable: '--font-cormorant', src: [{ path: './fonts/cormorant-normal-0.woff2', weight: '400 700', style: 'normal' }], display: 'swap' });
// Font khusus tema undangan: baru diunduh browser saat ada undangan yang memakainya (preload dimatikan).
const cinzel = localFont({ variable: '--font-cinzel', src: [{ path: './fonts/cinzel-normal-0.woff2', weight: '500 700', style: 'normal' }], display: 'swap', preload: false });
const pixel = localFont({ variable: '--font-pixel', src: [{ path: './fonts/pixel-normal-0.woff2', weight: '400', style: 'normal' }], display: 'swap', preload: false });
const fredoka = localFont({ variable: '--font-fredoka', src: [{ path: './fonts/fredoka-normal-0.woff2', weight: '400 600', style: 'normal' }], display: 'swap', preload: false });
// Batik Jawa (keraton): judul Playfair Display, isi Montserrat, aksara Jawa dekoratif Noto Sans Javanese.
const playfair = localFont({
  variable: '--font-playfair',
  src: [
    { path: './fonts/playfair-normal-1.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/playfair-italic-0.woff2', weight: '400 700', style: 'italic' },
  ],
  display: 'swap',
  preload: false,
});
const montserrat = localFont({ variable: '--font-montserrat', src: [{ path: './fonts/montserrat-normal-0.woff2', weight: '400 600', style: 'normal' }], display: 'swap', preload: false });
const javanese = localFont({ variable: '--font-javanese', src: [{ path: './fonts/javanese-normal-0.woff2', weight: '400 700', style: 'normal' }], display: 'swap', preload: false });
const libre = localFont({
  variable: '--font-libre',
  src: [
    { path: './fonts/libre-normal-1.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/libre-italic-0.woff2', weight: '400 700', style: 'italic' },
  ],
  display: 'swap',
  preload: false,
});
const source = localFont({ variable: '--font-source', src: [{ path: './fonts/source-normal-0.woff2', weight: '400 600', style: 'normal' }], display: 'swap', preload: false });

export const metadata: Metadata = {
  title: { default: 'WeddingLetter — Undangan pernikahan digital', template: '%s · WeddingLetter' },
  description: 'Buat undangan pernikahan digital yang cantik sendiri dari template mulai Rp20.000, dengan harga transparan. Atau pesan desain custom.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${fraunces.variable} ${script.variable} ${cormorant.variable} ${cinzel.variable} ${pixel.variable} ${fredoka.variable} ${playfair.variable} ${montserrat.variable} ${javanese.variable} ${libre.variable} ${source.variable} h-full`} data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Ekstensi browser (pengelola sandi, terjemahan, dsb.) sering menambah atribut ke <html>/<body> sebelum React aktif. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
