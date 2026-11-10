import { describe, expect, it } from 'vitest';
import { adminAssetKey, defaultDemoPhotoKey, invitationMediaKey, isDemoPhotoUploadKey } from './storage-keys.js';

describe('storage key hierarchy', () => {
  it('groups admin assets by purpose', () => {
    expect(adminAssetKey({ kind: 'image', purpose: 'template-thumbnail', templateId: 'tpl_1', id: 'asset_1', extension: 'webp' })).toBe(
      'template-thumbnails/tpl_1/asset_1.webp',
    );
    expect(adminAssetKey({ kind: 'image', purpose: 'template-sample', designId: 'jawa-sekar-keraton', slot: 'bride', id: 'asset_2', extension: 'jpg' })).toBe(
      'template-samples/jawa-sekar-keraton/bride/asset_2.jpg',
    );
    expect(adminAssetKey({ kind: 'audio', purpose: 'music-library', id: 'track_1', extension: 'mp3' })).toBe('music/library/track_1.mp3');
  });

  it('groups invitation media by invitation and type', () => {
    expect(invitationMediaKey({ invitationId: 'inv_1', mediaId: 'photo_1', type: 'PHOTO', extension: 'webp' })).toBe(
      'invitations/inv_1/photos/photo_1.webp',
    );
    expect(invitationMediaKey({ invitationId: 'inv_1', mediaId: 'song_1', type: 'SONG', extension: 'mp3' })).toBe(
      'invitations/inv_1/audio/song_1.mp3',
    );
  });

  it('keeps legacy demo uploads valid during migration', () => {
    expect(defaultDemoPhotoKey('groom')).toBe('system/demo/defaults/groom.svg');
    expect(isDemoPhotoUploadKey('assets/old.jpg')).toBe(true);
    expect(isDemoPhotoUploadKey('system/demo/uploads/groom/new.webp')).toBe(true);
    expect(isDemoPhotoUploadKey('system/demo/defaults/groom.svg')).toBe(false);
  });
});
