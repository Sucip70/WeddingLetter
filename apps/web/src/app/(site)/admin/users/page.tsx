import type { Metadata } from 'next';
import { Filters, Pager, Table, pickPage, pickString } from '@/components/admin/list';
import { Badge, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { authedFetch, requireAdmin } from '@/lib/session';
import { RoleButton } from './role-button';

export const metadata: Metadata = { title: 'Admin — pengguna' };

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  orders: number;
}

export default async function AdminUsers({ searchParams }: PageProps<'/admin/users'>) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = pickString(sp.q);
  const page = pickPage(sp.page);
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (q) query.set('q', q);
  const data = await authedFetch<{ items: Row[]; total: number; page: number; pageSize: number }>(`/admin/users?${query}`, '/admin/users');

  return (
    <>
      <PageHeader title="Pengguna" subtitle="Akun pelanggan dan admin." />
      <Filters q={q} placeholder="Cari nama atau email" />
      <Table head={['Nama', 'Email', 'Bergabung', 'Pesanan', 'Peran']}>
        {data.items.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
            <td className="px-4 py-3 text-ink-soft">{u.email}</td>
            <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(u.createdAt)}</td>
            <td className="px-4 py-3 tabular-nums">{u.orders}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Badge tone={u.role === 'ADMIN' ? 'rose' : 'neutral'}>{u.role === 'ADMIN' ? 'Admin' : 'Pengguna'}</Badge>
                {u.id !== me.id && <RoleButton id={u.id} role={u.role} />}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <Pager base="/admin/users" page={data.page} pageSize={data.pageSize} total={data.total} params={{ q }} />
    </>
  );
}
