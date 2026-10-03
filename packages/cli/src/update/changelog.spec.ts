import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { changelogBetween, releasedChangelog } from './changelog.js';

const CHANGELOG =
  '## 0.3.0\n\nFuture changes\n\n## 0.2.0\n\n### Patch Changes\n\n- Fix account navigation.\n\n## 0.1.0\n\nFirst release\n';
const released = {
  name: '@lsw-abpvue/account',
  version: '0.1.0',
  path: 'packages/account',
  releasedAt: '2026-09-01T00:00:00Z',
};
const directories: string[] = [];
const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        server =>
          new Promise<void>((resolve, reject) =>
            server.close(error => (error ? reject(error) : resolve())),
          ),
      ),
  );
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});
async function project(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'abpvue-changelog-'));
  directories.push(path);
  return path;
}
function archive(text: string): Buffer {
  const body = Buffer.from(text);
  const header = Buffer.alloc(512);
  header.write('package/CHANGELOG.md');
  header.write(body.length.toString(8).padStart(11, '0'), 124);
  header[156] = 48;
  return gzipSync(
    Buffer.concat([header, body, Buffer.alloc(((512 - (body.length % 512)) % 512) + 1024)]),
  );
}
async function registry(status = 200): Promise<typeof globalThis.fetch> {
  const server = createServer((request, response) => {
    if (request.url === '/archive') {
      response.end(archive(CHANGELOG));
      return;
    }
    const address = server.address();
    if (!address || typeof address === 'string') {
      response.writeHead(500);
      response.end();
      return;
    }
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ dist: { tarball: `http://127.0.0.1:${address.port}/archive` } }));
  });
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('The registry fixture has no address.');
  const origin = `http://127.0.0.1:${address.port}`;
  return (input, init) =>
    globalThis.fetch(
      String(input).startsWith('https://registry.npmjs.org/') ? `${origin}/metadata` : input,
      init,
    );
}

describe('released source changelogs', () => {
  it('includes changes after the release point and excludes past and future sections', () => {
    expect(changelogBetween(CHANGELOG, '0.1.0', '0.2.0')).toEqual([
      { version: '0.2.0', summary: '### Patch Changes\n\n- Fix account navigation.' },
    ]);
  });
  it('uses installed release notes when they cover the target version', async () => {
    const path = await project();
    await mkdir(join(path, 'node_modules/@lsw-abpvue/account'), { recursive: true });
    await writeFile(join(path, 'node_modules/@lsw-abpvue/account/CHANGELOG.md'), CHANGELOG);
    const report = await releasedChangelog(path, released, '0.2.0');
    expect(report.entries[0]?.summary).toContain('Fix account navigation');
    expect(report.unavailable).toBeUndefined();
  });
  it('reads the target package archive without extracting files into the project', async () => {
    const report = await releasedChangelog(await project(), released, '0.2.0', await registry());
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]?.version).toBe('0.2.0');
    expect(report.unavailable).toBeUndefined();
  });
  it('reports unavailable notes without blocking an upgrade or pretending there were no changes', async () => {
    const report = await releasedChangelog(await project(), released, '0.2.0', await registry(404));
    expect(report.unavailable).toContain('404');
    expect(report.entries).toEqual([]);
  });
});
