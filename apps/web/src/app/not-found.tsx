import { LogoMark } from '@/components/logo';
import { LinkButton } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <LogoMark className="h-12 w-12" />
      <h1 className="mt-6 font-display text-4xl text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-sm text-ink-soft">Link yang Anda buka mungkin salah ketik, atau undangan/template ini sudah tidak tersedia.</p>
      <div className="mt-8 flex gap-3">
        <LinkButton href="/">Ke beranda</LinkButton>
        <LinkButton href="/templates" variant="secondary">Lihat template</LinkButton>
      </div>
    </main>
  );
}
