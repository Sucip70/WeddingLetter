import fs from 'node:fs';
import path from 'node:path';
import { getTemplate } from '@/lib/catalog';
import { sampleView } from '@/lib/sample';
import { InvitationView } from '@/components/invitation/invitation-view';
export const dynamic = 'force-dynamic';
function localPhotos() {
  const dir = path.resolve(process.cwd(), '../api/assets/demo');
  const out: Record<string, string> = {};
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.svg')) out[f.replace('.svg', '')] = `data:image/svg+xml;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}`;
  return out;
}
// Harness uji sementara Batik Jawa: ?gate=show|skip &h= &fx= &cover= &p= &s= &bg= &tx=
export default async function P({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = await searchParams;
  const t = await getTemplate(q.tpl ?? 'cmuaqdkz800027cv32tpu4fos');
  const theme = q.tpl ? t.layout.theme : { ...t.layout.theme, preset: 'jawa', motif: 'jawa', primary: q.p ?? '#6b1e23', secondary: q.s ?? '#d4af37', background: q.bg ?? '#f5e6c8', text: q.tx ?? '#3a1518', headingFont: 'display', bodyFont: 'serif', gate: 'kayon', fx: q.fx ?? 'premium' } as typeof t.layout.theme;
  const have = new Set(t.layout.sections.map((x) => x.id));
  const extra = Object.values(t.addOnSections).filter((x) => ['rsvp', 'amplop_digital', 'buku_tamu'].includes(x.id) && !have.has(x.id));
  const layout = { ...t.layout, sections: [...t.layout.sections, ...extra], theme, coverLayouts: q.tpl ? (t.layout.coverLayouts ?? ['ornamen']) : ['ornamen', 'bingkai', 'gapura', 'emas'] };
  const view = sampleView(layout, {}, localPhotos(), q.cover ?? 'ornamen');
  return (
    <>
      <style>{`body{margin:0} .wl-root section:first-of-type{min-height:${q.h ?? '810'}px!important}`}</style>
      <InvitationView view={view} mode="live" placeholders gate={q.gate === 'show' ? 'show' : 'skip'} />
    </>
  );
}
