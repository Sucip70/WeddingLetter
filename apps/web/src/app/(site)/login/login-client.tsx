'use client';

import { useRouter } from 'next/navigation';
import { LoginPanel } from '@/components/login-panel';

export function LoginClient({ next }: { next: string }) {
  const router = useRouter();
  return (
    <LoginPanel
      onSuccess={() => {
        router.replace(next);
        router.refresh();
      }}
    />
  );
}
