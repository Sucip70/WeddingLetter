import Link from 'next/link';
import { whatsappLink } from '@/lib/format';
import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            Undangan pernikahan digital yang cantik dengan harga transparan. Bikin sendiri dari template, atau minta kami merancang desain khusus untuk Anda.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Jelajahi</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li><Link href="/templates" className="hover:text-ink">Semua template</Link></li>
            <li><Link href="/pricing" className="hover:text-ink">Harga & add-on</Link></li>
            <li><Link href="/dashboard" className="hover:text-ink">Undangan saya</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Butuh bantuan?</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
            <li>
              <a href={whatsappLink('Halo WeddingLetter, saya ingin bertanya tentang undangan digital.')} className="hover:text-ink" target="_blank" rel="noopener noreferrer">
                Chat WhatsApp
              </a>
            </li>
            <li>
              <a href={whatsappLink('Halo WeddingLetter, saya ingin memesan desain undangan custom.')} className="hover:text-ink" target="_blank" rel="noopener noreferrer">
                Pesan desain custom
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink-soft">© {new Date().getFullYear()} WeddingLetter. Dibuat dengan cinta di Indonesia.</div>
    </footer>
  );
}
