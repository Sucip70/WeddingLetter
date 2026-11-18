import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { PublicSettings } from '@/lib/legal';

export const metadata = { title: 'Kebijakan Privasi' };
export default async function PrivacyPage() {
  const { legal } = await apiFetch<PublicSettings>('/settings/public');
  const sections = [
    ['Data yang diproses', 'Data akun dan kontak, pesanan serta status pembayaran, konten undangan, foto dan media yang diunggah, daftar tamu, RSVP, ucapan, dan catatan kehadiran. Catatan teknis yang diperlukan digunakan untuk keamanan dan penanganan gangguan.'],
    ['Tujuan penggunaan', 'Data digunakan untuk mengelola akun, memproses pesanan dan pembayaran, menyimpan serta menayangkan undangan, menyediakan fitur tamu, mengirim pemberitahuan layanan, dan menangani bantuan. Foto dan undangan tidak digunakan untuk promosi tanpa persetujuan terpisah.'],
    ['Penyedia layanan', 'Penyedia pembayaran, penyimpanan media, hosting, dan pengiriman pemberitahuan memproses data yang diperlukan untuk menjalankan fungsinya. Kami tidak menjual data pribadi Anda.'],
    ['Akses publik', 'Undangan yang dipublikasikan dapat dilihat siapa pun yang memperoleh tautannya. Penerima dapat meneruskan tautan tersebut. Pertimbangkan sebelum menampilkan alamat, rekening, foto, dan informasi pribadi lainnya. Data tamu perlu digunakan secara patut dengan izin yang diperlukan.'],
    ['Penyimpanan dan penghapusan', `Draf berbayar baru yang belum dipublikasikan disimpan ${legal.draftRetentionDays} hari sejak pembayaran. Tenggat yang berlaku untuk pesanan Anda ditetapkan saat pembelian. Setelah masa aktif undangan berakhir, konten memasuki masa tenggang 30 hari. Konten dan berkas dapat dihapus setelah tenggat; catatan transaksi, bukti persetujuan, atau catatan yang diperlukan untuk kewajiban hukum dan penyelesaian sengketa dapat disimpan terpisah selama diperlukan. Draf isian sebelum checkout dapat tersimpan pada browser Anda dan dapat dihapus melalui pengaturan browser.`],
    ['Hak dan bantuan', `Hubungi ${legal.supportEmail} untuk meminta akses, koreksi, atau penghapusan data, maupun menyampaikan keluhan. Kami dapat memverifikasi identitas dan kewenangan Anda sebelum memenuhi permintaan. Penghapusan tertentu dapat dibatasi oleh kewajiban hukum atau penyelesaian transaksi. Bantuan tersedia ${legal.serviceHours}; target respons awal ${legal.responseBusinessDays} hari kerja.`],
  ];
  return <article className="mx-auto max-w-3xl px-4 py-16"><p className="text-xs uppercase tracking-widest text-rose">WeddingLetter</p><h1 className="mt-3 font-display text-4xl text-ink">Kebijakan Privasi</h1><p className="mt-4 text-sm text-ink-soft">Pengelola: <a href={legal.ownerUrl} className="underline">{legal.ownerName}</a> · Diperbarui 18 November 2026</p><div className="mt-10 space-y-8">{sections.map(([title, body]) => <section key={title}><h2 className="font-display text-2xl text-ink">{title}</h2><p className="mt-3 text-sm leading-7 text-ink-soft">{body}</p></section>)}</div><p className="mt-10 text-sm"><Link href="/syarat-ketentuan" className="underline">Baca Syarat &amp; Ketentuan</Link></p></article>;
}
