import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DAY_MS, PENDING_ORDER_TTL_HOURS, REMINDER_DAYS_BEFORE_EXPIRY } from '../config/constants.js';
import { LifecycleService } from '../invitations/lifecycle.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const INTERVAL_MS = 60 * 60 * 1000; // tiap jam

// Pekerjaan berkala (Bagian 7.1 & 8): masuk masa tenggang, hapus permanen, tutup pesanan kedaluwarsa,
// kirim pengingat H-3. Semua langkah idempotent, jadi aman jika berjalan bersamaan di lebih dari satu instance.
@Injectable()
export class MaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MaintenanceService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: LifecycleService,
    private readonly orders: OrdersService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    if (process.env.DISABLE_JOBS === 'true' || process.env.NODE_ENV === 'test') return;
    setTimeout(() => void this.safeRun(), 30_000).unref();
    this.timer = setInterval(() => void this.safeRun(), INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async safeRun() {
    try {
      const result = await this.run();
      this.logger.log(`Pemeliharaan selesai: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`Pemeliharaan gagal: ${(error as Error).message}`);
    }
  }

  async run(now = new Date()) {
    if (this.running) return { skipped: true as const };
    this.running = true;
    try {
      const expired = await this.lifecycle.expireDue(now);
      const staleOrders = await this.orders.expireStale(new Date(now.getTime() - PENDING_ORDER_TTL_HOURS * 3600 * 1000));
      const purged = await this.lifecycle.purgeDue(now);
      const replacements = await this.lifecycle.purgeStaleReplacements(now);
      const reminders = await this.sendReminders(now);
      return { expired, staleOrders, purged, replacements, reminders };
    } finally {
      this.running = false;
    }
  }

  private async sendReminders(now: Date) {
    const due = await this.prisma.invitation.findMany({
      where: {
        status: 'ACTIVE',
        reminderSentAt: null,
        expiresAt: { gt: now, lte: new Date(now.getTime() + REMINDER_DAYS_BEFORE_EXPIRY * DAY_MS) },
      },
      include: { order: { include: { user: true } } },
    });
    let sent = 0;
    for (const inv of due) {
      // "Klaim" dulu (atomik) supaya instance lain tidak mengirim ganda.
      const claimed = await this.prisma.invitation.updateMany({ where: { id: inv.id, reminderSentAt: null }, data: { reminderSentAt: now } });
      if (claimed.count === 0 || !inv.expiresAt) continue;
      await this.notifications.expiryReminder(inv.order.user, { id: inv.id, slug: inv.slug, expiresAt: inv.expiresAt });
      sent++;
    }
    return sent;
  }
}
