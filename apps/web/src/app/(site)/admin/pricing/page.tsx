import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { authedFetch } from '@/lib/session';
import type { AddOn } from '@/lib/types';
import { PricingManager } from './pricing-manager';

export const metadata: Metadata = { title: 'Admin — harga & kupon' };

export interface AdminCoupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'NOMINAL';
  value: number;
  quota: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export default async function AdminPricing() {
  const [addOns, coupons] = await Promise.all([
    authedFetch<(AddOn & { id: string })[]>('/admin/add-ons', '/admin/pricing'),
    authedFetch<AdminCoupon[]>('/admin/coupons', '/admin/pricing'),
  ]);
  return (
    <>
      <PageHeader title="Harga & kupon" subtitle="Harga per komponen dan kupon diskon. Perubahan langsung berlaku untuk kalkulator & pesanan baru; pesanan lama tetap memakai harga saat transaksi." />
      <PricingManager addOns={addOns} coupons={coupons} />
    </>
  );
}
