import { Injectable, Logger } from '@nestjs/common';

// Notifikasi email (Resend) dan WhatsApp (Fonnte). Tanpa kredensial di development, pesan hanya dicetak
// ke log. Kegagalan kirim TIDAK PERNAH melempar error: notifikasi tidak boleh menggagalkan alur utama.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private get webUrl() {
    return process.env.WEB_BASE_URL ?? 'http://localhost:3000';
  }

  async sendEmail(to: string, subject: string, text: string) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(`[DEV] Email ke ${to} — ${subject}\n${text}`);
      return;
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.MAIL_FROM ?? 'WeddingLetter <onboarding@resend.dev>', to, subject, text }),
      });
      if (!res.ok) this.logger.error(`Resend gagal (${res.status}): ${await res.text()}`);
    } catch (error) {
      this.logger.error(`Resend error: ${(error as Error).message}`);
    }
  }

  async sendWhatsApp(phone: string, message: string) {
    const target = normalizePhone(phone);
    const token = process.env.FONNTE_TOKEN;
    if (!target) return;
    if (!token) {
      this.logger.warn(`[DEV] WhatsApp ke ${target}:\n${message}`);
      return;
    }
    try {
      const form = new FormData();
      form.set('target', target);
      form.set('message', message);
      const res = await fetch('https://api.fonnte.com/send', { method: 'POST', headers: { Authorization: token }, body: form });
      if (!res.ok) this.logger.error(`Fonnte gagal (${res.status}): ${await res.text()}`);
    } catch (error) {
      this.logger.error(`Fonnte error: ${(error as Error).message}`);
    }
  }

  async paymentReceived(user: { name: string; email: string }, orderId: string, total: number, invitationId?: string) {
    const link = invitationId ? `${this.webUrl}/dashboard/invitations/${invitationId}` : `${this.webUrl}/dashboard`;
    await this.sendEmail(
      user.email,
      'Pembayaran diterima — WeddingLetter',
      `Halo ${user.name},\n\nPembayaran pesanan ${orderId} sebesar ${formatRupiah(total)} sudah kami terima.\nAtur & publikasikan undangan Anda di:\n${link}\n\nTerima kasih!`,
    );
  }

  async expiryReminder(
    user: { name: string; email: string; phone: string | null },
    invitation: { id: string; slug: string; expiresAt: Date },
  ) {
    const link = `${this.webUrl}/dashboard/invitations/${invitation.id}`;
    const date = invitation.expiresAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
    const text = `Halo ${user.name}, undangan Anda (/${invitation.slug}) akan berakhir pada ${date}. Perpanjang di ${link} agar tetap bisa dibuka tamu. Data disimpan 30 hari setelah berakhir.`;
    await this.sendEmail(user.email, 'Undangan Anda segera berakhir — WeddingLetter', text);
    if (user.phone) await this.sendWhatsApp(user.phone, text);
  }
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return digits;
}

export function formatRupiah(n: number) {
  return `Rp${n.toLocaleString('id-ID')}`;
}
