import { formatDateTime, rupiah } from '@/lib/format';
import type { OrderDetail, OrderStatus } from '@/lib/types';
import { Badge } from './ui';

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'gold' | 'sage' | 'neutral' | 'danger' }> = {
  PENDING: { label: 'Menunggu pembayaran', tone: 'gold' },
  PAID: { label: 'Lunas', tone: 'sage' },
  EXPIRED: { label: 'Kedaluwarsa', tone: 'neutral' },
  CANCELLED: { label: 'Dibatalkan', tone: 'neutral' },
  REFUNDED: { label: 'Direfund', tone: 'danger' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function OrderLines({ order }: { order: OrderDetail }) {
  return (
    <div>
      <dl className="space-y-2.5 text-sm">
        {order.subtotal > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Template {order.templateName}</dt>
            <dd className="font-medium tabular-nums text-ink">{rupiah(order.subtotal)}</dd>
          </div>
        )}
        {order.lines.map((l) => (
          <div key={l.code} className="flex justify-between gap-4">
            <dt className="text-ink-soft">
              {l.label}
              {l.quantity > 1 && <span className="ml-1 text-xs">({l.quantity} × {rupiah(l.unitPrice)})</span>}
            </dt>
            <dd className="font-medium tabular-nums text-ink">{rupiah(l.amount)}</dd>
          </div>
        ))}
        {order.couponDiscount > 0 && (
          <div className="flex justify-between gap-4 text-sage">
            <dt>Kupon {order.coupon ?? ''}</dt>
            <dd className="font-medium tabular-nums">−{rupiah(order.couponDiscount)}</dd>
          </div>
        )}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold text-ink">Total</span>
        <span className="font-display text-3xl text-ink">{rupiah(order.totalAmount)}</span>
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        Pesanan {order.id} · dibuat {formatDateTime(order.createdAt)}
        {order.paidAt && ` · dibayar ${formatDateTime(order.paidAt)}`}
      </p>
    </div>
  );
}
