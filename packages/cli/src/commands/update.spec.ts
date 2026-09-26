import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runUpdate, type UpdateArgs } from './update.js';

const projects: string[] = [];

interface Manifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

async function project(manifest: Manifest, released?: Record<string, unknown>): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'abpvue-update-'));
  projects.push(cwd);

  await writeFile(
    join(cwd, 'package.json'),
    `${JSON.stringify({ name: 'app', private: true, ...manifest }, null, 2)}\n`,
    'utf8',
  );

  if (released) {
    await mkdir(join(cwd, '.abpvue'), { recursive: true });
    await writeFile(
      join(cwd, '.abpvue/source-code.json'),
      `${JSON.stringify({ packages: released }, null, 2)}\n`,
      'utf8',
    );
  }

  return cwd;
}

afterEach(async () => {
  await Promise.all(projects.splice(0).map(cwd => rm(cwd, { recursive: true, force: true })));
});

const manifestOf = async (cwd: string): Promise<Manifest> =>
  JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')) as Manifest;

const args = (cwd: string, extra: Partial<UpdateArgs> = {}): UpdateArgs => ({
  cwd,
  to: '0.2.0',
  ...extra,
});

describe('update', () => {
  it('moves every @lsw-abpvue range and leaves the rest alone', async () => {
    const cwd = await project({
      dependencies: {
        '@lsw-abpvue/core': '^0.1.0',
        '@lsw-abpvue/identity': '^0.1.0',
        vue: '^3.5.41',
      },
      devDependencies: { '@lsw-abpvue/cli': '0.1.0', vite: '^8.2.1' },
    });

    await runUpdate(args(cwd));
    const manifest = await manifestOf(cwd);

    expect(manifest.dependencies?.['@lsw-abpvue/core']).toBe('^0.2.0');
    expect(manifest.dependencies?.['@lsw-abpvue/identity']).toBe('^0.2.0');
    expect(manifest.devDependencies?.['@lsw-abpvue/cli']).toBe('0.2.0');
    expect(manifest.dependencies?.vue).toBe('^3.5.41');
    expect(manifest.devDependencies?.vite).toBe('^8.2.1');
  });

  it('keeps the modifier the project chose', async () => {
    const cwd = await project({
      dependencies: { '@lsw-abpvue/core': '~0.1.0', '@lsw-abpvue/utils': '0.1.0' },
    });

    await runUpdate(args(cwd));
    const manifest = await manifestOf(cwd);

    expect(manifest.dependencies?.['@lsw-abpvue/core']).toBe('~0.2.0');
    expect(manifest.dependencies?.['@lsw-abpvue/utils']).toBe('0.2.0');
  });

  it('leaves a package whose source is in the project, and says why', async () => {
    const cwd = await project(
      { dependencies: { '@lsw-abpvue/core': '^0.1.0', '@lsw-abpvue/identity': '^0.1.0' } },
      {
        '@lsw-abpvue/identity': {
          name: '@lsw-abpvue/identity',
          version: '0.1.0',
          path: 'packages/identity',
          releasedAt: '2026-09-01T00:00:00.000Z',
        },
      },
    );

    const result = await runUpdate(args(cwd));
    const manifest = await manifestOf(cwd);

    expect(manifest.dependencies?.['@lsw-abpvue/identity']).toBe('^0.1.0');
    expect(manifest.dependencies?.['@lsw-abpvue/core']).toBe('^0.2.0');
    expect(result.released.map(entry => entry.name)).toEqual(['@lsw-abpvue/identity']);
    expect(result.changes.find(change => change.name === '@lsw-abpvue/identity')?.skipped).toMatch(
      /source is in this project/,
    );
  });

  it('leaves a range it cannot read rather than guessing at it', async () => {
    const cwd = await project({
      dependencies: { '@lsw-abpvue/core': 'file:../core', '@lsw-abpvue/utils': '^0.1.0' },
    });

    const result = await runUpdate(args(cwd));

    expect((await manifestOf(cwd)).dependencies?.['@lsw-abpvue/core']).toBe('file:../core');
    expect(result.changes.find(change => change.name === '@lsw-abpvue/core')?.skipped).toMatch(
      /not a version this can rewrite/,
    );
  });

  it('a dry run writes nothing', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.1.0' } });

    const result = await runUpdate(args(cwd, { 'dry-run': true }));

    expect(result.changes[0]?.to).toBe('^0.2.0');
    expect((await manifestOf(cwd)).dependencies?.['@lsw-abpvue/core']).toBe('^0.1.0');
  });

  it('refuses to go backwards', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.3.0' } });

    await expect(runUpdate(args(cwd))).rejects.toThrow(/newer than/);
  });

  it('asks the registry when it is not told a version', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.1.0' } });
    const fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ version: '0.4.2' }), { status: 200 })),
    ) as unknown as typeof globalThis.fetch;

    const result = await runUpdate({ cwd, fetch });

    expect(result.to).toBe('0.4.2');
    expect((await manifestOf(cwd)).dependencies?.['@lsw-abpvue/core']).toBe('^0.4.2');
  });

  it('says what to do when the registry cannot be reached', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.1.0' } });
    const fetch = vi.fn(() =>
      Promise.reject(new Error('offline')),
    ) as unknown as typeof globalThis.fetch;

    await expect(runUpdate({ cwd, fetch })).rejects.toThrow(/--to/);
  });

  it('runs the migrations between the two versions, in order', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.1.0' } });
    const ran: string[] = [];

    const migration = (version: string) => ({
      version,
      description: `what changed in ${version}`,
      run: () => {
        ran.push(version);
        return Promise.resolve([`${version}: one file`]);
      },
    });

    const result = await runUpdate(
      args(cwd, {
        migrations: [migration('0.3.0'), migration('0.2.0'), migration('0.1.0')],
      }),
    );

    // 0.1.0 is where the project already is, and 0.3.0 is past where it is going.
    expect(ran).toEqual(['0.2.0']);
    expect(result.migrations[0]?.changed).toEqual(['0.2.0: one file']);
  });

  it('tells a migration it is a dry run', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.1.0' } });
    const run = vi.fn(() => Promise.resolve([]));

    await runUpdate(
      args(cwd, {
        'dry-run': true,
        migrations: [{ version: '0.2.0', description: 'a change', run }],
      }),
    );

    expect(run).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true }));
  });

  it('says what to do when the registry answers with something that is not JSON', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.1.0' } });
    const fetch = vi.fn(() =>
      Promise.resolve(new Response('<html>a proxy login page</html>', { status: 200 })),
    ) as unknown as typeof globalThis.fetch;

    await expect(runUpdate({ cwd, fetch })).rejects.toThrow(/--to/);
  });

  it('refuses a version it cannot parse', async () => {
    const cwd = await project({ dependencies: { '@lsw-abpvue/core': '^0.1.0' } });

    await expect(runUpdate(args(cwd, { to: 'next' }))).rejects.toThrow(/is not a version/);
  });
});
