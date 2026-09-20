import { daysLeft, formatDate } from '@/lib/format';
import type { InvitationStatus } from '@/lib/types';
import { Badge } from './ui';

export const INVITATION_STATUS: Record<InvitationStatus, { label: string; tone: 'gold' | 'sage' | 'neutral' | 'danger' | 'rose' }> = {
  DRAFT: { label: 'Draf (belum dipublikasikan)', tone: 'gold' },
  ACTIVE: { label: 'Aktif', tone: 'sage' },
  PAUSED: { label: 'Dijeda', tone: 'neutral' },
  EXPIRED_GRACE: { label: 'Berakhir (masa tenggang)', tone: 'danger' },
  DELETED: { label: 'Dihapus', tone: 'neutral' },
};

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const s = INVITATION_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

// Teks sisa masa aktif yang ramah: "Aktif sampai 12 Des 2026 · 45 hari lagi".
export function expiryText(status: InvitationStatus, expiresAt: string | null, remainingDays: number | null) {
  if (status === 'PAUSED') return `Dijeda · sisa ${remainingDays ?? 0} hari (hitung mundur berhenti)`;
  if (!expiresAt) return status === 'DRAFT' ? 'Masa aktif mulai dihitung saat dipublikasikan' : '';
  const d = daysLeft(expiresAt);
  if (status === 'EXPIRED_GRACE') return `Berakhir ${formatDate(expiresAt)} · data disimpan 30 hari`;
  if (d === null) return '';
  return `Aktif sampai ${formatDate(expiresAt)} · ${d > 0 ? `${d} hari lagi` : 'berakhir hari ini'}`;
}
