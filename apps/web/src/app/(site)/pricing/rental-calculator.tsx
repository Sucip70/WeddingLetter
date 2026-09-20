'use client';

import { useState } from 'react';
import { Card, Field, Input } from '@/components/ui';
import { billableMb, rupiah } from '@/lib/format';

export function RentalCalculator({ rate }: { rate: number }) {
  const [mbValue, setMbValue] = useState(100);
  const [weeks, setWeeks] = useState(1);
  const billable = billableMb(Math.max(1, mbValue) * 1024 * 1024);
  const total = billable * weeks * rate;

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-ink">Coba kalkulator sewa</h3>
      <div className="mt-5 space-y-5">
        <Field label={`Ukuran file: ${mbValue} MB`}>
          <input type="range" min={1} max={500} value={mbValue} onChange={(e) => setMbValue(Number(e.target.value))} className="w-full accent-[#b4533c]" aria-label="Ukuran file dalam MB" />
        </Field>
        <Field label="Lama tayang (minggu)">
          <Input type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Math.min(52, Math.max(1, Number(e.target.value) || 1)))} />
        </Field>
      </div>
      <div className="mt-6 rounded-2xl bg-ivory p-5 text-center">
        <p className="text-sm text-ink-soft">{billable} MB × {weeks} minggu × {rupiah(rate)}</p>
        <p className="mt-1 font-display text-4xl text-rose">{rupiah(total)}</p>
      </div>
    </Card>
  );
}
