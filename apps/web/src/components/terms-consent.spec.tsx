import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TermsConsent, type useCheckoutTerms } from './terms-consent';
import { LegalDocument } from './legal-document';
import type { LegalPolicy } from '../lib/legal';

vi.mock('@/lib/client-api', () => ({ api: vi.fn() }));
const policy: LegalPolicy = { version: 'v1', revision: 'v1', supportWhatsapp: '6282125622542', settings: { ownerName: 'Ahmad Sucipto', ownerUrl: 'https://www.linkedin.com/in/ahmad-sucipto-5429881a7/', supportEmail: 'ahmad0sucipto@gmail.com', serviceHours: 'Senin–Sabtu, 08.00–17.00 WIB', responseBusinessDays: 1, draftRetentionDays: 100 }, sections: [{ title: 'Pembatalan', paragraphs: ['Refund dalam 48 jam.'] }] };
const terms = { policy, accepted: false, setAccepted: vi.fn(), failed: false, ready: false } as ReturnType<typeof useCheckoutTerms>;

describe('checkout agreement', () => {
  it('is unchecked by default and does not ask for marketing consent', () => {
    const html = renderToStaticMarkup(createElement(TermsConsent, { terms }));
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('checked=""');
    expect(html).toContain('100 hari');
    expect(html).not.toContain('promosi');
  });
  it('opens the policies separately so form data stays in place', () => {
    const html = renderToStaticMarkup(createElement(TermsConsent, { terms }));
    expect(html).toContain('href="/syarat-ketentuan"');
    expect(html).toContain('href="/kebijakan-privasi"');
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
  });
  it('fails closed when policy is unavailable', () => {
    const html = renderToStaticMarkup(createElement(TermsConsent, { terms: { ...terms, policy: null, failed: true } }));
    expect(html).toContain('disabled=""');
    expect(html).toContain('Ketentuan belum dapat dimuat');
  });
  it('explains manual extension refund review', () => {
    const html = renderToStaticMarkup(createElement(TermsConsent, { terms, extension: true }));
    expect(html).toContain('diperiksa manual');
    expect(html).not.toContain('Draf berbayar disimpan');
  });
  it('renders the stored identity, document version and acceptance time', () => {
    const html = renderToStaticMarkup(createElement(LegalDocument, { policy, acceptedAt: '2026-11-18T01:00:00Z' }));
    expect(html).toContain(policy.settings.ownerUrl);
    expect(html).toContain('Ahmad Sucipto');
    expect(html).toContain('Versi v1');
    expect(html).toContain('Disetujui');
    expect(html).toContain('100 hari');
  });
});
