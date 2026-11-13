import { describe, expect, it } from 'vitest';
import { assertPublisherApi, assertPublisherBucket, publisherTarget } from './publisher-target.js';

describe('explicit production catalog target', () => {
  it('keeps staging as an independent target and requires confirmation for production apply', () => {
    expect(publisherTarget('staging', true)).toBe('staging');
    expect(publisherTarget('production', false)).toBe('production');
    expect(() => publisherTarget('production', true)).toThrow('confirm-production');
    expect(publisherTarget('production', true, 'weddingletter.id')).toBe('production');
    expect(() => publisherTarget('invalid', false)).toThrow();
  });
  it('rejects cross-environment API destinations and insecure production URLs', () => {
    expect(() => assertPublisherApi('https://weddingletter.id', 'production')).not.toThrow();
    for (const base of ['https://staging.weddingletter.id', 'http://weddingletter.id', 'http://localhost:4000', 'https://weddingletter.id/other', 'https://weddingletter.id?x=1', 'https://user:password@weddingletter.id']) {
      expect(() => assertPublisherApi(base, 'production')).toThrow();
    }
    expect(() => assertPublisherApi('https://weddingletter.id', 'staging')).toThrow();
    expect(() => assertPublisherApi('http://localhost:4000', 'staging')).not.toThrow();
  });
  it('refuses wrong buckets and staging asset URLs for production', () => {
    expect(() => assertPublisherBucket('weddingletter-production', 'https://media.weddingletter.id', 'production')).not.toThrow();
    expect(() => assertPublisherBucket('weddingletter-staging', 'https://media.weddingletter.id', 'production')).toThrow();
    expect(() => assertPublisherBucket('weddingletter-production', 'https://media-staging.weddingletter.id', 'production')).toThrow();
    expect(() => assertPublisherBucket('weddingletter-production', 'https://media.weddingletter.id', 'staging')).toThrow();
  });
});
