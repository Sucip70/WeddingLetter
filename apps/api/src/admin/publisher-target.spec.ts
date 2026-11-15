import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { applyPublisherEnv, assertPublisherApi, assertPublisherBucket, publisherEnvPath, publisherTarget } from './publisher-target.js';

describe('publisher environment file argument', () => {
  it('overrides staging destination defaults without changing source configuration', () => {
    const environment = { TARGET_R2_BUCKET_NAME: 'weddingletter-staging', PUBLISHER_TOKEN: 'old', DATABASE_URL: 'local-db', R2_BUCKET_NAME: 'source' };
    applyPublisherEnv({ TARGET_R2_BUCKET_NAME: 'weddingletter-production', PUBLISHER_TOKEN: 'new', DATABASE_URL: 'other-db', R2_BUCKET_NAME: 'other' }, environment);
    expect(environment).toEqual({ TARGET_R2_BUCKET_NAME: 'weddingletter-production', PUBLISHER_TOKEN: 'new', DATABASE_URL: 'local-db', R2_BUCKET_NAME: 'source' });
  });
  const root = path.resolve('repository');
  it('resolves the production env file from the repository root, not workspace cwd', () => {
    expect(publisherEnvPath(['sync', '--publisher-env', '.env.publisher.production', '--target', 'production'], root)).toBe(path.join(root, '.env.publisher.production'));
    expect(publisherEnvPath(['sync'], root)).toBe(path.join(root, '.env.publisher'));
  });
  it('supports absolute paths and refuses missing option values', () => {
    const file = path.resolve('folder with spaces', 'publisher.env');
    expect(publisherEnvPath(['check', '--publisher-env', file], root)).toBe(file);
    expect(() => publisherEnvPath(['sync', '--publisher-env'], root)).toThrow('requires a file path');
    expect(() => publisherEnvPath(['sync', '--publisher-env', '--apply'], root)).toThrow('requires a file path');
  });
});

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
