# Peranakan Seruni — Chinese Indonesian Celebration v2

Sistem konten ini memakai identitas pernikahan Tionghoa Indonesia yang lebih tegas: merah cinnabar, lacquer merah tua, emas seremonial, kartu ivory, lampion, awan keberuntungan, `囍`, kipas, koin, petasan, dan koi. Seluruh aset produksi berupa raster PNG; tidak ada SVG.

## Aset produksi v2

- `page-background-v2.png` — latar merah 1024×1536, opaque, dengan border dan awan di tepi.
- `info-card-v2.png` — kartu ivory transparan 1024×1536 untuk teks live.
- `ornament-lantern-pair-v2.png` — pasangan lampion dan koin transparan 1024×1536.
- `ornament-koi-bottom-v2.png` — pasangan koi bawah transparan 1024×1536.
- `divider-fan-v2.png` — divider kipas transparan 2172×724.
- `section-marker-double-happiness-v2.png` — medali `囍` transparan 1254×1254.
- `ornament-firecracker-coins-v2.png` — ornamen sisi petasan dan koin transparan 1024×1536.
- `photo-frame-v2.png` — bingkai foto merah–emas transparan 1024×1536.
- `revision-v2-celebration-preview.png` — preview yang disetujui; berisi teks contoh dan bukan layer produksi.
- `source-renders-v2/` — render sumber raster untuk penyuntingan lanjutan.

## Pembagian motif per section

- Acara utama: background + kartu + lampion + `囍`; kipas boleh dipakai sebagai divider kecil.
- Cerita atau galeri: background + bingkai foto. Jangan tambahkan kartu ivory.
- Hadiah atau RSVP: background + kartu + petasan/koin di satu sisi.
- Penutup: background + kartu + koi di bawah semua teks.
- Section tenang: background + kartu + satu divider kipas.

## Aturan keseimbangan

- Maksimal dua keluarga motif besar dalam satu viewport.
- Area tengah untuk nama, detail acara, alamat, guest name, dan CTA harus bersih.
- Ornamen boleh kaya di tepi, tetapi tidak boleh berada tepat di belakang teks live.
- Skala marker `囍` sekitar 12–18% lebar viewport; divider 38–55%; ornamen sisi maksimum 12–16%.
- Jangan menumpuk lampion, koi, dan petasan dalam viewport yang sama.
- Jangan menumpuk photo frame dengan info card.
- Tidak menggunakan batik, pagoda, naga, phoenix, zodiac, atau gaya poster wisata/Imlek komersial.

## Implementasi

`manifest.json` adalah sumber aturan layer. Nama versi ini adalah revisi visual saja; nomor artwork database immutable tetap ditentukan oleh engineering saat publishing.
