// Slot foto demo. Foto bawaan (ilustrasi placeholder) ada di apps/api/assets/demo/<slot>.svg dan diunggah
// ke storage sebagai assets/demo-<slot>.svg oleh seed / `npm run demo:photos`.
export interface DemoSlot {
  slot: string;
  label: string;
  hint: string;
  // Ada berkas bawaan di assets/demo.
  hasDefault: boolean;
}

export const DEMO_SLOTS: DemoSlot[] = [
  { slot: 'groom', label: 'Mempelai pria', hint: 'Potret 4:5 (mis. 800x1000). Tampil di bingkai foto mempelai.', hasDefault: true },
  { slot: 'bride', label: 'Mempelai wanita', hint: 'Potret 4:5 (mis. 800x1000). Tampil di bingkai foto mempelai.', hasDefault: true },
  { slot: 'gallery1', label: 'Galeri 1', hint: 'Foto pertama galeri tampil lebar (rasio 16:10, bagian tengah yang terlihat).', hasDefault: true },
  { slot: 'gallery2', label: 'Galeri 2', hint: 'Potret 4:5.', hasDefault: true },
  { slot: 'gallery3', label: 'Galeri 3', hint: 'Potret 4:5.', hasDefault: true },
  { slot: 'gallery4', label: 'Galeri 4', hint: 'Foto lebar (rasio 16:10, bagian tengah yang terlihat).', hasDefault: true },
  { slot: 'gallery5', label: 'Galeri 5', hint: 'Potret 4:5.', hasDefault: true },
  { slot: 'gallery6', label: 'Galeri 6', hint: 'Potret 4:5.', hasDefault: true },
  { slot: 'gallery7', label: 'Galeri 7', hint: 'Foto lebar (rasio 16:10, bagian tengah yang terlihat).', hasDefault: true },
  { slot: 'gallery8', label: 'Galeri 8', hint: 'Potret 4:5.', hasDefault: true },
  { slot: 'cover', label: 'Foto sampul', hint: 'Potret 4:5 atau lebih tinggi, subjek di tengah (tampil penuh di layout foto penuh, dan terpotong di bingkai/jendela/bulat/hati). Dipakai demo Standard & Premium; demo Basic memakai ornamen.', hasDefault: true },
];

export const SLOT_IDS = DEMO_SLOTS.map((s) => s.slot);
export const defaultKey = (slot: string) => `assets/demo-${slot}.svg`;
