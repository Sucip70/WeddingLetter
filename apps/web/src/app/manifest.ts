import type { MetadataRoute } from 'next';

// PNG icons share the approved Surat Janji raster master with the website logo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WeddingLetter — Undangan pernikahan digital',
    short_name: 'WeddingLetter',
    description: 'Buat undangan pernikahan digital yang cantik dari template mulai Rp20.000.',
    lang: 'id',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7f1',
    theme_color: '#80051c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
