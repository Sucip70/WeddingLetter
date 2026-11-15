import path from 'node:path';

// Publisher destinations take precedence over workspace defaults, but must not
// replace the database or storage configuration used to read source assets.
export function applyPublisherEnv(values: Record<string, string>, environment: NodeJS.ProcessEnv = process.env) {
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('TARGET_R2_') || key === 'PUBLISHER_TOKEN') environment[key] = value;
  }
}

// Do not use --env-file: Node/tsx may consume that reserved option before the
// publisher starts, relative to the workspace cwd instead of the repository root.
export function publisherEnvPath(args: string[], repositoryRoot: string): string {
  const index = args.indexOf('--publisher-env');
  if (index === -1) return path.join(repositoryRoot, '.env.publisher');
  const file = args[index + 1];
  if (!file || file.startsWith('--')) throw new Error('--publisher-env requires a file path');
  return path.resolve(repositoryRoot, file);
}

export const PUBLISHER_TARGETS = {
  staging: { api: 'https://staging.weddingletter.id', bucket: 'weddingletter-staging' },
  production: { api: 'https://weddingletter.id', bucket: 'weddingletter-production' },
} as const;
export type PublisherTargetName = keyof typeof PUBLISHER_TARGETS;

export function publisherTarget(name: string, apply: boolean, confirmation?: string): PublisherTargetName {
  if (name !== 'staging' && name !== 'production') throw new Error('Target must be staging or production');
  if (name === 'production' && apply && confirmation !== 'weddingletter.id') {
    throw new Error('Production requires --confirm-production weddingletter.id');
  }
  return name;
}

export function assertPublisherApi(base: string, target: PublisherTargetName) {
  const url = new URL(base);
  const local = target === 'staging' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw new Error('API target must be a clean origin');
  if (!local && url.origin !== PUBLISHER_TARGETS[target].api) throw new Error(`API does not match ${target}`);
}

export function assertPublisherBucket(bucket: string | undefined, publicUrl: string, target: PublisherTargetName) {
  if (bucket !== PUBLISHER_TARGETS[target].bucket) throw new Error(`Target bucket must explicitly be ${PUBLISHER_TARGETS[target].bucket}`);
  if (!publicUrl.startsWith('https://')) throw new Error('TARGET_R2_PUBLIC_URL must use HTTPS');
  if (target === 'production' && publicUrl.replace(/\/$/, '') !== 'https://media.weddingletter.id') throw new Error('Production asset URL must be https://media.weddingletter.id');
}
