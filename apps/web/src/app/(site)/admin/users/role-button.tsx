'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/lib/client-api';

export function RoleButton({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const next = role === 'ADMIN' ? 'USER' : 'ADMIN';
  return (
    <button
      disabled={busy}
      className="text-xs font-medium text-rose hover:underline disabled:opacity-50"
      onClick={async () => {
        if (!confirm(next === 'ADMIN' ? 'Jadikan pengguna ini admin? Admin punya akses penuh ke panel.' : 'Cabut akses admin pengguna ini?')) return;
        setBusy(true);
        try {
          await api(`admin/users/${id}/role`, { method: 'PATCH', body: { role: next } });
          router.refresh();
        } catch (e) {
          alert(errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      {next === 'ADMIN' ? 'Jadikan admin' : 'Cabut admin'}
    </button>
  );
}
