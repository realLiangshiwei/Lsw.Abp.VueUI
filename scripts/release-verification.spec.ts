import { execFile } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const run = promisify(execFile);

async function releaseFixture(version = '1.2.3-alpha.1') {
  const root = await mkdtemp(join(tmpdir(), 'abpvue-release-verification-'));
  await mkdir(join(root, 'scripts'));
  await mkdir(join(root, 'packages/core'), { recursive: true });
  await mkdir(join(root, 'bin'));
  for (const name of ['publish-packages.mjs', 'verify-release.mjs']) {
    await copyFile(new URL(name, import.meta.url), join(root, 'scripts', name)).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
  await writeFile(
    join(root, 'packages/core/package.json'),
    JSON.stringify({ name: '@lsw-abpvue/core', version }),
  );
  const calls = join(root, 'calls.jsonl');
  const pnpm = join(root, 'bin/pnpm');
  await writeFile(
    pnpm,
    '#!/usr/bin/env node\n' +
      "const fs = require('node:fs');\n" +
      'const args = process.argv.slice(2);\n' +
      "fs.appendFileSync(process.env.ABP_RELEASE_CALLS, JSON.stringify(args) + '\\n');\n" +
      'if (args[0] === process.env.ABP_RELEASE_FAIL_STEP) process.exit(1);\n',
  );
  await chmod(pnpm, 0o755);
  const invoke = (script: string, args: string[] = [], failure?: string) =>
    run(process.execPath, [join(root, 'scripts', script), ...args], {
      env: {
        ...process.env,
        PATH: `${join(root, 'bin')}${delimiter}${process.env.PATH}`,
        ABP_RELEASE_CALLS: calls,
        ABP_RELEASE_FAIL_STEP: failure ?? '',
      },
    });
  return {
    root,
    invoke,
    calls: async (): Promise<string[][]> =>
      (await readFile(calls, 'utf8').catch(() => ''))
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as string[]),
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

it('verifies all release checks without publishing', async () => {
  const fixture = await releaseFixture();
  try {
    await fixture.invoke('verify-release.mjs');
    const calls = await fixture.calls();
    for (const step of [
      'lint',
      'typecheck',
      'test:coverage',
      'build',
      'size',
      'check:published-types',
      'check:resolution',
      'check:external-install',
      'check:source-code-release',
      'check:create-lib',
    ]) {
      expect(calls).toContainEqual([step]);
    }
    expect(calls).toContainEqual(['--filter', 'playground', 'bench:build']);
    expect(calls.some(args => args.includes('publish'))).toBe(false);
  } finally {
    await fixture.dispose();
  }
});

it('stops verification at the first failed check', async () => {
  const fixture = await releaseFixture();
  try {
    await expect(fixture.invoke('verify-release.mjs', [], 'typecheck')).rejects.toMatchObject({
      code: 1,
    });
    expect(await fixture.calls()).toEqual([['lint'], ['typecheck']]);
  } finally {
    await fixture.dispose();
  }
});

it('blocks publication when verification fails', async () => {
  const fixture = await releaseFixture();
  try {
    await expect(fixture.invoke('publish-packages.mjs', [], 'typecheck')).rejects.toMatchObject({
      code: 1,
    });
    expect(await fixture.calls()).toEqual([['lint'], ['typecheck']]);
  } finally {
    await fixture.dispose();
  }
});

it.each([
  ['1.2.3-alpha.1', 'alpha'],
  ['1.2.3-beta.1', 'beta'],
  ['1.2.3-rc.1', 'rc'],
  ['1.2.3', 'latest'],
])('verifies %s before choosing its %s publication tag', async (version, tag) => {
  const fixture = await releaseFixture(version);
  try {
    await fixture.invoke('publish-packages.mjs', ['--dry-run']);
    const calls = await fixture.calls();
    expect(calls[0]).toEqual(['lint']);
    expect(calls.at(-2)).toEqual(['check:create-lib']);
    expect(calls.at(-1)).toEqual([
      '--recursive',
      '--filter',
      '@lsw-abpvue/core',
      'publish',
      '--access',
      'public',
      '--tag',
      tag,
      '--no-git-checks',
      '--dry-run',
    ]);
  } finally {
    await fixture.dispose();
  }
});

it('shows release help without running checks or publishing', async () => {
  const fixture = await releaseFixture();
  try {
    await fixture.invoke('publish-packages.mjs', ['--help']);
    expect(await fixture.calls()).toEqual([]);
  } finally {
    await fixture.dispose();
  }
});

it('rejects manual tag overrides before running checks', async () => {
  const fixture = await releaseFixture();
  try {
    await expect(fixture.invoke('publish-packages.mjs', ['--tag', 'latest'])).rejects.toMatchObject(
      {
        code: 1,
      },
    );
    expect(await fixture.calls()).toEqual([]);
  } finally {
    await fixture.dispose();
  }
});
