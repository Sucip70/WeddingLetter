import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendOtp(email: string, code: string, ttlMinutes: number) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Pengiriman email belum dikonfigurasi');
      }
      // Dev tanpa kredensial Resend: cetak kode ke log supaya alur login tetap bisa dites.
      this.logger.warn(`[DEV] OTP untuk ${email}: ${code}`);
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? 'WeddingLetter <onboarding@resend.dev>',
        to: email,
        subject: `Kode masuk WeddingLetter: ${code}`,
        text: `Kode masuk Anda: ${code}\n\nBerlaku ${ttlMinutes} menit. Jangan bagikan kode ini ke siapa pun.`,
      }),
    });
    if (!res.ok) {
      this.logger.error(`Resend gagal (${res.status}): ${await res.text()}`);
      throw new ServiceUnavailableException('Gagal mengirim email, coba lagi sebentar');
    }
  }
}
