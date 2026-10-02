import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, expect, it } from 'vitest';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

it('installs prerelease tarballs for application and library dependencies', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'abpvue-tarballs-'));
  directories.push(directory);
  const core = join(directory, 'lsw-abpvue-core-0.0.1-alpha.0.tgz');
  const utils = join(directory, 'lsw-abpvue-utils-0.0.1-alpha.0.tgz');
  await Promise.all([
    writeFile(core, ''),
    writeFile(utils, ''),
    writeFile(
      join(directory, 'package.json'),
      JSON.stringify({
        dependencies: { '@lsw-abpvue/core': '^0.0.1-alpha.0', vue: '^3.5.0' },
        devDependencies: { '@lsw-abpvue/utils': '0.0.1-alpha.0' },
        peerDependencies: { '@lsw-abpvue/core': '^0.0.1-alpha.0' },
      }),
    ),
  ]);

  const result = spawnSync('python3', [resolve('scripts/local-tarball-deps.py'), directory], {
    cwd: directory,
    encoding: 'utf8',
  });
  expect(result.status, result.stderr).toBe(0);
  const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  expect(manifest.dependencies['@lsw-abpvue/core']).toBe(`file:${core}`);
  expect(manifest.devDependencies['@lsw-abpvue/utils']).toBe(`file:${utils}`);
  expect(manifest.dependencies.vue).toBe('^3.5.0');
  expect(manifest.peerDependencies['@lsw-abpvue/core']).toBe('^0.0.1-alpha.0');
});
