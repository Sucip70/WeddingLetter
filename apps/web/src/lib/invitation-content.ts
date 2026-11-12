import type { InvitationData, SectionDef } from './types';

export const DEFAULT_INVITATION_TEXT = {
  cerita: {
    kutipan: 'Semoga langkah kami selalu dipenuhi kasih, kesabaran, dan kebahagiaan dalam membangun kehidupan bersama.',
    cerita: 'Berawal dari sebuah pertemuan sederhana, kami saling mengenal dan tumbuh bersama. Dengan restu keluarga, kami memilih untuk melangkah menuju kehidupan baru sebagai pasangan.',
  },
  rsvp: { pengantar: 'Kehadiran dan doa restu Anda sangat berarti bagi kami. Mohon konfirmasikan kehadiran Anda melalui formulir berikut.' },
} as const;

export function initialInvitationContent(sections: SectionDef[]): InvitationData {
  const data: InvitationData = {};
  for (const section of sections) for (const field of section.fields) {
    const defaults = DEFAULT_INVITATION_TEXT[section.id as keyof typeof DEFAULT_INVITATION_TEXT] as Record<string, string> | undefined;
    if (defaults?.[field.key]) data[section.id] = { ...data[section.id], [field.key]: defaults[field.key] };
  }
  return data;
}

export interface StoryEntry { year: string; title: string; text: string }
export function parseYearlyStory(value: string): StoryEntry[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed) || parsed.type !== 'yearly-story' || !('entries' in parsed) || !Array.isArray(parsed.entries) || parsed.entries.length > 12) return null;
    if (!parsed.entries.every((e: unknown) => !!e && typeof e === 'object' && 'year' in e && typeof e.year === 'string' && 'title' in e && typeof e.title === 'string' && 'text' in e && typeof e.text === 'string')) return null;
    return parsed.entries as StoryEntry[];
  } catch { return null; }
}
export const serializeYearlyStory = (entries: StoryEntry[]) => JSON.stringify({ type: 'yearly-story', entries });
