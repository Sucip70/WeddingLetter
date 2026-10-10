import { TemplateThumb } from '@/components/template-thumb';
export const dynamic = 'force-dynamic';
const theme = { preset: 'jawa', motif: 'jawa', fx: 'premium', gate: 'kayon', primary: '#6b1e23', secondary: '#d4af37', background: '#f5e6c8', text: '#3a1518', headingFont: 'display', bodyFont: 'serif' } as never;
export default function P() {
  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, background: '#fff' }}>
      <div style={{ width: 200, height: 270 }}><TemplateThumb theme={theme} /></div>
      <div style={{ width: 200, height: 270 }}><TemplateThumb theme={{ ...(theme as object), primary: '#1f4a3a', background: '#f2ead2' } as never} /></div>
    </div>
  );
}
