import type { InvitationData, InvitationDetail, InvitationViewData, Theme } from './types';

/** Preserve the entire paid layout snapshot, including published artwork URLs.
 * The editor may override draft content and colors, never strip design metadata. */
export function purchasedInvitationPreview(
  invitation: InvitationDetail,
  data: InvitationData,
  theme: Theme,
): InvitationViewData {
  return {
    slug: invitation.slug,
    templateName: invitation.templateName,
    layout: { ...invitation.layout, theme, coverLayouts: invitation.layout.coverLayouts ?? [] },
    features: invitation.features,
    data,
    media: Object.fromEntries(invitation.media
      .filter((m) => ['UPLOADED', 'ACTIVE', 'PAUSED', 'EXPIRED_GRACE'].includes(m.status))
      .map((m) => [m.id, { url: m.url, type: m.type }])),
    rsvpEnabled: invitation.layout.sections.some((s) => s.id === 'rsvp'),
    guestbook: [],
  };
}
