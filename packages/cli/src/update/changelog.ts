import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { ReleasedPackage } from '../source-code/record.js';
import { compareVersions } from './versions.js';

export interface ChangelogEntry {
  version: string;
  summary: string;
}

export interface ReleasedChangelog {
  name: string;
  from: string;
  to: string;
  entries: ChangelogEntry[];
  unavailable?: string | undefined;
}

/** Reads the release sections newer than the copied source, up to the requested version. */
export function changelogBetween(text: string, from: string, to: string): ChangelogEntry[] {
  const headings = [...text.matchAll(/^##\s+\[?(\d+\.\d+\.\d+(?:-[\w.-]+)?)\]?(?:\s.*)?$/gm)];
  return headings.flatMap((heading, index) => {
    const version = heading[1] ?? '';
    if (compareVersions(version, from) <= 0 || compareVersions(version, to) > 0) return [];
    const start = (heading.index ?? 0) + heading[0].length;
    return [
      { version, summary: text.slice(start, headings[index + 1]?.index ?? text.length).trim() },
    ];
  });
}

function tarChangelog(archive: Uint8Array): string | undefined {
  const tar = gunzipSync(archive, { maxOutputLength: 32 * 1024 * 1024 });
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    if (!name) break;
    const size = Number.parseInt(
      header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim(),
      8,
    );
    if (!Number.isSafeInteger(size) || size < 0 || offset + 512 + size > tar.length)
      throw new ChangelogReadError('The package archive is incomplete.');
    if (name === 'package/CHANGELOG.md' && (header[156] === 0 || header[156] === 48))
      return tar.subarray(offset + 512, offset + 512 + size).toString('utf8');
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return undefined;
}

class ChangelogReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChangelogReadError';
  }
}

async function boundedArchive(response: Response): Promise<Uint8Array> {
  if (!response.body) throw new ChangelogReadError('The package archive is empty.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8 * 1024 * 1024)
        throw new ChangelogReadError('The package archive exceeds 8 MiB.');
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const archive = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    archive.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return archive;
}

/** Gets a released package's changelog without replacing or extracting its source. */
export async function releasedChangelog(
  project: string,
  released: ReleasedPackage,
  to: string,
  send: typeof globalThis.fetch = globalThis.fetch,
): Promise<ReleasedChangelog> {
  const report: ReleasedChangelog = {
    name: released.name,
    from: released.version,
    to,
    entries: [],
  };
  if (compareVersions(released.version, to) >= 0) return report;
  const local = await readFile(
    join(project, 'node_modules', released.name, 'CHANGELOG.md'),
    'utf8',
  ).catch(() => '');
  if (local) {
    report.entries = changelogBetween(local, released.version, to);
    if (report.entries.some(entry => entry.version === to)) return report;
  }
  try {
    const metadataUrl = `https://registry.npmjs.org/${encodeURIComponent(released.name)}/${encodeURIComponent(to)}`;
    const response = await send(metadataUrl, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new ChangelogReadError(`The registry answered ${response.status}.`);
    const metadata = (await response.json()) as { dist?: { tarball?: string } };
    if (!metadata.dist?.tarball)
      throw new ChangelogReadError('The registry named no package archive.');
    const url = new URL(metadata.dist.tarball);
    if (
      url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    )
      throw new ChangelogReadError('The registry returned an unsupported archive URL.');
    const archive = await send(url.href, { signal: AbortSignal.timeout(10_000) });
    if (!archive.ok)
      throw new ChangelogReadError(`The package archive answered ${archive.status}.`);
    const text = tarChangelog(await boundedArchive(archive));
    if (!text) throw new ChangelogReadError('The package contains no CHANGELOG.md.');
    report.entries = changelogBetween(text, released.version, to);
  } catch (error) {
    report.unavailable = error instanceof Error ? error.message : String(error);
  }
  return report;
}
