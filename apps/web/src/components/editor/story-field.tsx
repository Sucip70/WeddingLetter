'use client';

import { useState } from 'react';
import { Button, Field, Input, Textarea } from '../ui';
import { DEFAULT_INVITATION_TEXT, parseYearlyStory, serializeYearlyStory, type StoryEntry } from '../../lib/invitation-content';

export function StoryField({ value, label, maxLength = 1500, required, error, onChange }: {
  value: string; label: string; maxLength?: number; required?: boolean; error?: string; onChange: (value: string) => void;
}) {
  const [lengthError, setLengthError] = useState('');
  const entries = parseYearlyStory(value);
  const update = (next: StoryEntry[]) => {
    const text = serializeYearlyStory(next);
    if (text.length > maxLength) { setLengthError(`Cerita melebihi batas ${maxLength} karakter. Pendekkan salah satu bagian.`); return; }
    setLengthError(''); onChange(text);
  };
  return <Field label={label} required={required} error={error || lengthError} hint={`${value.length}/${maxLength} karakter${entries ? ' termasuk struktur tahun' : ''}`}>
    {entries ? <div className="space-y-3">
      {entries.map((entry, index) => <div key={index} className="space-y-2 rounded-xl border border-line p-3">
        <div className="flex items-center gap-2">
          <Input aria-label={`Tahun cerita ${index + 1}`} placeholder="Tahun, mis. 2022" inputMode="numeric" maxLength={4} value={entry.year} onChange={(e) => update(entries.map((item, i) => i === index ? { ...item, year: e.target.value.replace(/\D/g, '') } : item))} />
          <Button type="button" variant="secondary" size="sm" onClick={() => update(entries.filter((_, i) => i !== index))}>Hapus</Button>
        </div>
        <Input aria-label={`Judul cerita ${index + 1}`} placeholder="Mis. Pertemuan pertama" value={entry.title} maxLength={100} onChange={(e) => update(entries.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} />
        <Textarea aria-label={`Cerita tahun ${index + 1}`} placeholder="Ceritakan momen kalian…" rows={3} value={entry.text} onChange={(e) => update(entries.map((item, i) => i === index ? { ...item, text: e.target.value } : item))} />
        <div className="flex gap-2">
          {[-1, 1].map((offset) => <Button key={offset} type="button" variant="secondary" size="sm" disabled={index + offset < 0 || index + offset >= entries.length} onClick={() => { const next = [...entries]; [next[index], next[index + offset]] = [next[index + offset]!, next[index]!]; update(next); }}>{offset < 0 ? 'Naik' : 'Turun'}</Button>)}
        </div>
      </div>)}
      <Button type="button" variant="secondary" size="sm" disabled={entries.length >= 12} onClick={() => update([...entries, { year: '', title: '', text: '' }])}>Tambah tahun</Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange(entries.map((e) => [e.year, e.title, e.text].filter(Boolean).join('\n')).join('\n\n'))}>Jadikan satu cerita</Button>
    </div> : <>
      <Textarea rows={4} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => update([{ year: '', title: '', text: value }])}>Bagi per tahun</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange(DEFAULT_INVITATION_TEXT.cerita.cerita)}>Gunakan teks default</Button>
      </div>
    </>}
  </Field>;
}
