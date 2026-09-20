import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { runAddPackage } from './add-package.js';

describe('abpv add-package', () => {
  let project: string;

  beforeEach(async () => {
    project = await mkdtemp(join(tmpdir(), 'abpvue-add-'));

    await writeFile(
      join(project, 'package.json'),
      JSON.stringify({ dependencies: { '@lsw-abpvue/identity': '1.2.3' } }),
      'utf8',
    );
    await writeFile(join(project, 'tsconfig.json'), '{ "compilerOptions": { "paths": {} } }\n');

    const installed = join(project, 'node_modules/@lsw-abpvue/identity');
    await mkdir(join(installed, 'src'), { recursive: true });
    await writeFile(
      join(installed, 'package.json'),
      JSON.stringify({
        name: '@lsw-abpvue/identity',
        version: '1.2.3',
        exports: { '.': { import: './dist/index.js' } },
      }),
      'utf8',
    );
    await writeFile(join(installed, 'src/index.ts'), 'export const users = true;\n', 'utf8');
  });

  afterEach(async () => {
    await rm(project, { recursive: true, force: true });
  });

  it('releases the source of a package the project has', async () => {
    const result = await runAddPackage({
      cwd: project,
      package: '@lsw-abpvue/identity',
      'with-source-code': true,
    });

    expect(result.release?.released.map(entry => entry.name)).toEqual(['@lsw-abpvue/identity']);
    expect(await readFile(join(project, 'packages/identity/src/index.ts'), 'utf8')).toContain(
      'users',
    );
  });

  it('leaves installing a package to the package manager', async () => {
    await expect(runAddPackage({ cwd: project, package: '@lsw-abpvue/identity' })).rejects.toThrow(
      CliError,
    );
  });

  it('asks which package when none was named', async () => {
    await expect(runAddPackage({ cwd: project, 'with-source-code': true })).rejects.toThrow(
      CliError,
    );
  });

  it('lists what can be released', async () => {
    const result = await runAddPackage({ cwd: project, 'list-source-ready': true });

    expect(result.releasable).toEqual(['@lsw-abpvue/identity']);
  });
});
