const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,120}$/;

export type AdminAssetPurpose =
  | 'template-thumbnail'
  | 'template-sample'
  | 'template-audio'
  | 'demo-photo'
  | 'music-library';

export function safeSegment(value: string | undefined, fallback = 'unassigned') {
  return value && SAFE_SEGMENT.test(value) ? value : fallback;
}

export function adminAssetKey(input: {
  kind: 'image' | 'audio';
  purpose?: AdminAssetPurpose;
  id: string;
  extension: string;
  designId?: string;
  templateId?: string;
  slot?: string;
}) {
  const filename = `${safeSegment(input.id, 'asset')}.${safeSegment(input.extension, 'bin')}`;
  switch (input.purpose) {
    case 'template-thumbnail':
      return `template-thumbnails/${safeSegment(input.templateId ?? input.designId)}/${filename}`;
    case 'template-sample':
      return `template-samples/${safeSegment(input.designId)}/${safeSegment(input.slot, 'misc')}/${filename}`;
    case 'template-audio':
      return `templates/${safeSegment(input.designId)}/audio/${filename}`;
    case 'demo-photo':
      return `system/demo/uploads/${safeSegment(input.slot, 'misc')}/${filename}`;
    case 'music-library':
      return `music/library/${filename}`;
    default:
      return `admin/misc/${input.kind}/${filename}`;
  }
}

export function invitationMediaKey(input: {
  invitationId: string;
  mediaId: string;
  type: 'PHOTO' | 'VIDEO' | 'SONG';
  extension: string;
}) {
  const folder = input.type === 'PHOTO' ? 'photos' : input.type === 'VIDEO' ? 'videos' : 'audio';
  return `invitations/${safeSegment(input.invitationId)}/${folder}/${safeSegment(input.mediaId)}.${safeSegment(input.extension, 'bin')}`;
}

export function defaultDemoPhotoKey(slot: string) {
  return `system/demo/defaults/${safeSegment(slot)}.svg`;
}

export const LEGACY_ADMIN_ASSET_KEY_RE = /^assets\/[A-Za-z0-9_-]+\.(jpe?g|png|webp)$/;
export const DEMO_UPLOAD_KEY_RE = /^system\/demo\/uploads\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(jpe?g|png|webp)$/;

export function isDemoPhotoUploadKey(key: string) {
  return LEGACY_ADMIN_ASSET_KEY_RE.test(key) || DEMO_UPLOAD_KEY_RE.test(key);
}
