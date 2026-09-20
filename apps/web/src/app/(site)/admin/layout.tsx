import { AdminNav } from '@/components/admin/admin-nav';
import { requireAdmin } from '@/lib/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
