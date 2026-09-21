// Pustaka lagu bawaan. Semua trek DIBUAT ORISINAL lewat sintesis kode (apps/web/scripts/generate-music.mjs),
// jadi bebas royalti & bebas klaim hak cipta. File dilayani dari web: /audio/<id>.mp3.
// Bebas diganti/ditambah lagu berlisensi lain lewat template builder admin.

export interface Track {
  id: string;
  name: string;
  mood: string;
}

export const TRACKS: Track[] = [
  { id: 'piano-romantis', name: 'Piano Romantis', mood: 'Lembut, hangat, cocok untuk semua tema' },
  { id: 'gitar-akustik', name: 'Gitar Akustik Pagi', mood: 'Petikan akustik santai' },
  { id: 'kalimba-taman', name: 'Kalimba Taman', mood: 'Ringan dan ceria seperti angklung' },
  { id: 'harpa-nusantara', name: 'Harpa Nusantara', mood: 'Petikan harpa bernuansa timur' },
  { id: 'gamelan-slendro', name: 'Gamelan Slendro', mood: 'Metalofon Jawa, tenang dan khidmat' },
  { id: 'gamelan-bali', name: 'Gamelan Bali', mood: 'Metalofon Bali yang lincah' },
  { id: 'guzheng-tionghoa', name: 'Guzheng Pentatonik', mood: 'Petikan pentatonik ala Tiongkok' },
  { id: 'oud-hijaz', name: 'Oud Timur Tengah', mood: 'Petikan oud, tangga nada hijaz' },
  { id: 'paduan-suci', name: 'Paduan Suci', mood: 'Pad paduan suara yang syahdu' },
  { id: 'kotak-musik', name: 'Kotak Musik Dongeng', mood: 'Denting kotak musik, manis dan magis' },
  { id: 'lonceng-salju', name: 'Lonceng Salju', mood: 'Lonceng bening musim dingin' },
  { id: 'chiptune-petualangan', name: 'Chiptune Petualangan', mood: 'Gaya 8-bit retro' },
  { id: 'synthwave-malam', name: 'Synthwave Malam', mood: 'Arpeggio neon era 80-an' },
  { id: 'sinema-string', name: 'Sinema Strings', mood: 'Orkestra pad sinematik' },
  { id: 'ambient-galaksi', name: 'Ambient Galaksi', mood: 'Melayang luas seperti luar angkasa' },
  { id: 'jazz-klasik', name: 'Jazz Klasik', mood: 'Ayunan jazz ala film lama' },
  { id: 'waltz-paris', name: 'Waltz Paris', mood: 'Waltz romantis 3/4' },
  { id: 'ukulele-pantai', name: 'Ukulele Pantai', mood: 'Ceria dan cerah seperti musim panas' },
  { id: 'cello-gugur', name: 'Cello Musim Gugur', mood: 'Hangat dan melankolis' },
  { id: 'perayaan-ceria', name: 'Perayaan Ceria', mood: 'Marimba riang untuk pesta' },
];

export const TRACK_IDS = TRACKS.map((t) => t.id);
export const trackUrl = (id: string) => `/audio/${id}.mp3`;
export const presetsFor = (ids: string[]) => ids.map((id) => TRACKS.find((t) => t.id === id)).filter((t): t is Track => !!t).map((t) => ({ name: t.name, url: trackUrl(t.id) }));
