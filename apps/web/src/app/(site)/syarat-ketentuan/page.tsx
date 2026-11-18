import { LegalDocument } from '@/components/legal-document';
import { apiFetch } from '@/lib/api';
import type { PublicSettings } from '@/lib/legal';

export const metadata = { title: 'Syarat & Ketentuan' };
export default async function TermsPage() {
  const { policy } = await apiFetch<PublicSettings>('/settings/public');
  return <LegalDocument policy={policy} />;
}
