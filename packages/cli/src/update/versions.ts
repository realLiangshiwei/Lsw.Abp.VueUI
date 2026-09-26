/** The npm scope every package of this UI is published under. */
export const SCOPE = '@lsw-abpvue/';

/** The package whose version stands for the release as a whole. */
export const ANCHOR = `${SCOPE}core`;

const REGISTRY = 'https://registry.npmjs.org';

/** A range as a manifest writes it, split into what it means. */
export interface Range {
  /** `^`, `~`, or empty for an exact version. */
  modifier: string;
  version: string;
}

const RANGE = /^([\^~]?)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/**
 * The version a dependency range names, when it names one. A range this does not
 * understand -- a tag, a git URL, a `file:` path, `>=1 <2` -- is one to leave alone.
 * @param range The range as the manifest writes it
 */
export function parseRange(range: string): Range | undefined {
  const match = RANGE.exec(range.trim());

  return match ? { modifier: match[1] as string, version: match[2] as string } : undefined;
}

/**
 * Orders two versions the way semver does, prerelease included: `1.2.0-rc.1` is before
 * `1.2.0`, and `1.2.0-rc.2` is after `1.2.0-rc.1`.
 *
 * @param left One version
 * @param right The other
 * @returns Negative when `left` is older, positive when it is newer, zero when they match
 */
export function compareVersions(left: string, right: string): number {
  const [leftCore = '', leftPre] = left.split('-', 2);
  const [rightCore = '', rightPre] = right.split('-', 2);

  const leftParts = leftCore.split('.').map(Number);
  const rightParts = rightCore.split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  // A version with a prerelease is older than the same version without one.
  if (leftPre === undefined && rightPre === undefined) return 0;
  if (leftPre === undefined) return 1;
  if (rightPre === undefined) return -1;

  return comparePrerelease(leftPre, rightPre);
}

function comparePrerelease(left: string, right: string): number {
  const leftParts = left.split('.');
  const rightParts = right.split('.');

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const one = leftParts[index];
    const other = rightParts[index];

    if (one === undefined) return -1;
    if (other === undefined) return 1;
    if (one === other) continue;

    const numeric = /^\d+$/.test(one) && /^\d+$/.test(other);

    return numeric ? Number(one) - Number(other) : one < other ? -1 : 1;
  }

  return 0;
}

export interface RegistryOptions {
  /** The dist-tag to ask for; `latest` unless told otherwise. */
  tag?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
  registry?: string | undefined;
}

export class RegistryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'RegistryError';
  }
}

/**
 * The version the registry publishes under a dist-tag.
 * @param options Which tag, and what to ask with
 */
export async function latestVersion(options: RegistryOptions = {}): Promise<string> {
  const tag = options.tag ?? 'latest';
  const url = `${options.registry ?? REGISTRY}/${ANCHOR.replace('/', '%2f')}/${tag}`;
  const send = options.fetch ?? globalThis.fetch;
  let response: Response;

  try {
    response = await send(url);
  } catch (cause) {
    throw new RegistryError(
      `Cannot reach ${url}. Pass --to with the version to upgrade to, and no network is needed.`,
      { cause },
    );
  }

  if (!response.ok) {
    throw new RegistryError(
      `${url} answered ${response.status}. There may be no "${tag}" release yet; ` +
        'pass --to with a version.',
    );
  }

  const manifest = (await response.json()) as { version?: string };

  if (!manifest.version) throw new RegistryError(`${url} named no version.`);

  return manifest.version;
}
