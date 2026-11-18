import { createHash } from 'node:crypto';
import { z } from 'zod';

export const legalSettingsSchema = z.object({
  ownerName: z.string().trim().min(1).max(120),
  ownerUrl: z.string().url().max(300).refine((v) => v.startsWith('https://'), 'Gunakan tautan HTTPS'),
  supportEmail: z.string().email().max(200),
  serviceHours: z.string().trim().min(1).max(160),
  responseBusinessDays: z.number().int().min(1).max(14),
  draftRetentionDays: z.number().int().min(1).max(3650),
});
export const LEGAL_DEFAULTS = {
  ownerName: 'Ahmad Sucipto',
  ownerUrl: 'https://www.linkedin.com/in/ahmad-sucipto-5429881a7/',
  supportEmail: 'ahmad0sucipto@gmail.com',
  serviceHours: 'Senin–Sabtu, 08.00–17.00 WIB',
  responseBusinessDays: 1,
  draftRetentionDays: 100,
};
export type LegalSettings = z.infer<typeof legalSettingsSchema>;

// This same document is rendered publicly and snapshotted at checkout.
// Change the revision whenever policy wording changes.
export function buildLegalPolicy(settings: LegalSettings, supportWhatsapp: string) {
  const sections = [
    { title: 'Layanan yang Anda beli', paragraphs: [
      'Anda memperoleh hak menggunakan template dan fitur sesuai paket yang dipilih, selama masa aktif pesanan. Harga, fitur, kuota media, masa aktif, dan tambahan berbayar ditampilkan sebelum pembayaran.',
      'Pembelian tidak mencakup kode sumber, kepemilikan template, atau hak menjual ulang desain WeddingLetter. Desain custom menggunakan penawaran dan kesepakatan tertulis tersendiri mengenai ruang lingkup, revisi, jadwal, serta pembayaran.',
    ] },
    { title: 'Akun dan data undangan', paragraphs: [
      'Jaga keamanan akun Anda. Pastikan nama, tanggal, lokasi, nomor rekening, dan informasi lain sudah benar sebelum undangan dipublikasikan. Jangan berikan kata sandi atau kode verifikasi kepada pihak lain.',
    ] },
    { title: 'Harga dan pembayaran', paragraphs: [
      'Total biaya ditampilkan sebelum pembayaran. Tambahan layanan hanya dikenakan sesuai pilihan dalam ringkasan pesanan. Gunakan halaman pembayaran resmi; pesanan lunas setelah pembayaran diverifikasi sistem.',
      'Jika sudah membayar tetapi status belum berubah, jangan membayar ulang. Hubungi bantuan dengan nomor pesanan dan bukti pembayaran. Kami tidak meminta PIN, OTP, atau kata sandi rekening.',
    ] },
    { title: 'Publikasi dan masa aktif', paragraphs: [
      'Pembayaran tidak langsung memublikasikan undangan. Lengkapi dan periksa isinya, lalu pilih publikasikan. Masa aktif awal dihitung sejak publikasi pertama, sesuai durasi yang dibeli. Mengedit undangan tidak memulai ulang masa aktif.',
      'Perpanjangan dapat dibeli melalui aplikasi. Biaya dan durasi terlihat sebelum pembayaran. Media tambahan dapat memiliki masa tayang berbeda dari undangan. Perpanjangan yang dibayar diterapkan otomatis; untuk undangan yang masih aktif, waktu tambahan mengikuti tanggal berakhir sebelumnya.',
    ] },
    { title: 'Penyimpanan draf dan penghapusan data', paragraphs: [
      `Draf berbayar yang belum pernah dipublikasikan disimpan selama ${settings.draftRetentionDays} hari sejak pembayaran berhasil. Tenggat khusus pesanan ditampilkan setelah pembayaran. Setelah tenggat, draf dan berkas terkait dihapus dan tidak dapat dipulihkan. Kami mengupayakan pengingat melalui email pada H-14 dan H-3; tetap perhatikan tenggat di akun Anda.`,
      'Setelah masa aktif undangan yang pernah dipublikasikan berakhir, tautan tidak dapat diakses publik. Data dan berkas memasuki masa tenggang 30 hari sejak berakhir, sehingga masih dapat diperpanjang. Setelahnya, data dan berkas dapat dihapus permanen. Simpan salinan berkas penting secara mandiri.',
      'Perubahan durasi penyimpanan hanya berlaku untuk pesanan baru dan tidak memperpendek tenggat pesanan lama. Catatan transaksi dan bukti persetujuan disimpan terpisah dari konten undangan sesuai kebutuhan layanan dan kewajiban yang berlaku.',
    ] },
    { title: 'Pembatalan dan pengembalian dana', paragraphs: [
      'Untuk undangan baru berbasis template, refund penuh dapat diajukan paling lambat 48 jam sejak pembayaran berhasil, selama undangan belum pernah dipublikasikan. Setelah publikasi atau batas waktu tersebut, pembatalan karena perubahan pilihan atau pembatalan acara tidak termasuk refund standar.',
      'Refund perpanjangan dan add-on dapat diajukan paling lambat 48 jam sejak pembayaran, sepanjang manfaatnya belum digunakan. Tim memeriksa penggunaan dan kelayakannya secara manual; pengajuan tidak berarti refund otomatis disetujui. Perpanjangan yang langsung mengaktifkan kembali undangan sudah mulai digunakan. Refund proporsional otomatis tidak tersedia.',
      'Pembayaran ganda, kesalahan sistem, atau layanan yang tidak diberikan sesuai pesanan tetap diperiksa untuk perbaikan atau refund yang sesuai, terlepas dari kebijakan pembatalan biasa. Hak konsumen yang dilindungi hukum tetap berlaku.',
      'Ajukan melalui bantuan dengan nomor pesanan. Cara dan estimasi waktu pengembalian diinformasikan setelah verifikasi; dana tidak selalu kembali otomatis melalui metode semula. Untuk pembatalan pesanan undangan baru yang direfund, akses dihentikan dan data serta berkas terkait dihapus. Simpan salinan terlebih dahulu.',
    ] },
    { title: 'Hak atas konten unggahan', paragraphs: [
      'Pastikan Anda memiliki hak atau izin atas foto, video, musik, dan data orang lain yang dimasukkan. Konten tetap milik Anda atau pemegang haknya. Izin untuk WeddingLetter terbatas pada penyimpanan, pemrosesan, penyesuaian ukuran, dan penayangan untuk menjalankan layanan.',
      'Foto atau undangan Anda tidak digunakan untuk promosi tanpa persetujuan terpisah. Dilarang menggunakan layanan untuk penipuan, konten melanggar hukum, atau pelanggaran hak pihak lain.',
    ] },
    { title: 'Privasi dan akses undangan', paragraphs: [
      'Undangan yang dipublikasikan dapat diakses melalui tautannya, dan penerima dapat meneruskan tautan tersebut. Pertimbangkan informasi pribadi yang ditampilkan. Gunakan data tamu secara patut dan dengan izin yang diperlukan.',
      'Data akun, pesanan, konten undangan, dan data tamu diproses untuk menyediakan layanan, pembayaran, bantuan, dan keamanan. Penyedia pembayaran dan infrastruktur memproses data yang diperlukan untuk fungsinya. Penggunaan untuk pemasaran membutuhkan persetujuan terpisah. Permintaan akses, koreksi, atau penghapusan dapat disampaikan melalui bantuan; sebagian catatan dapat tetap disimpan untuk kewajiban hukum atau penyelesaian transaksi.',
    ] },
    { title: 'Gangguan layanan dan bantuan', paragraphs: [
      'Kami melakukan pemeriksaan dan upaya pemulihan yang wajar saat terjadi gangguan. Masalah layanan berbayar ditangani menurut dampaknya, termasuk kemungkinan perbaikan, tambahan masa aktif, atau refund yang sesuai.',
      `Layanan bantuan tersedia ${settings.serviceHours}. Target respons awal paling lambat ${settings.responseBusinessDays} hari kerja. Waktu penyelesaian bergantung pada jenis kendala dan kebutuhan pemeriksaan.`,
    ] },
    { title: 'Perubahan ketentuan dan keluhan', paragraphs: [
      'Versi ketentuan yang Anda setujui disimpan pada pesanan. Perubahan tidak berlaku sepihak untuk mengurangi hak pesanan yang sudah disepakati. Keluhan diupayakan selesai melalui komunikasi dan musyawarah; hak menggunakan mekanisme penyelesaian sengketa menurut hukum Indonesia tetap tersedia.',
    ] },
  ];
  const document = { revision: '2026-11-18-v1', settings, supportWhatsapp, sections };
  const version = `${document.revision}-${createHash('sha256').update(JSON.stringify(document)).digest('hex').slice(0, 16)}`;
  return { ...document, version };
}
