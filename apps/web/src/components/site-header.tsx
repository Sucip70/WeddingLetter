import { getUser } from '@/lib/session';
import { Logo } from './logo';
import { NavMenu } from './nav-menu';

export async function SiteHeader() {
  const user = await getUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <NavMenu user={user} />
      </div>
    </header>
  );
}
