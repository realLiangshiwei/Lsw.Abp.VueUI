import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { entriesOf } from './entries.js';
import { readSourceCodeRecord } from './record.js';
import { releasablePackages, releaseSourceCode } from './release.js';

const TSCONFIG = `{
  "compilerOptions": {
    // Where a released package is picked up from.
    "paths": {}
  }
}
`;

async function installPackage(
  project: string,
  name: string,
  options: {
    exports: Record<string, unknown>;
    directories: string[];
    version?: string;
    dependencies?: Record<string, string>;
  },
): Promise<void> {
  const root = join(project, 'node_modules', name);

  await mkdir(root, { recursive: true });
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      name,
      version: options.version ?? '1.2.3',
      exports: options.exports,
      dependencies: options.dependencies ?? {},
    }),
    'utf8',
  );

  for (const directory of options.directories) {
    await mkdir(join(root, directory), { recursive: true });
    await writeFile(join(root, directory, 'index.ts'), `export const from = '${name}';\n`, 'utf8');
  }
}

describe('entriesOf', () => {
  it('reads the entry points off the package rather than assuming them', () => {
    const entries = entriesOf({
      name: '@lsw-abpvue/identity',
      exports: {
        '.': { import: './dist/index.js' },
        './config': { import: './dist/config/index.js' },
        './package.json': './package.json',
      },
    });

    expect(entries).toEqual([
      { specifier: '@lsw-abpvue/identity', directory: 'src', file: 'src/index.ts' },
      {
        specifier: '@lsw-abpvue/identity/config',
        directory: 'config/src',
        file: 'config/src/index.ts',
      },
    ]);
  });

  it('finds a stylesheet where a theme keeps it, not where it is published', () => {
    const entries = entriesOf({
      name: '@lsw-abpvue/theme-basic',
      exports: { '.': { import: './dist/index.js' }, './style.css': './dist/style.css' },
    });

    expect(entries[1]).toEqual({
      specifier: '@lsw-abpvue/theme-basic/style.css',
      directory: 'src',
      file: 'src/styles/style.css',
    });
  });
});

describe('releaseSourceCode', () => {
  let project: string;

  beforeEach(async () => {
    project = await mkdtemp(join(tmpdir(), 'abpvue-release-'));

    await writeFile(
      join(project, 'package.json'),
      JSON.stringify({
        name: 'acme-bookstore',
        dependencies: {
          '@lsw-abpvue/core': '1.2.3',
          '@lsw-abpvue/identity': '1.2.3',
          '@lsw-abpvue/theme-basic': '1.2.3',
        },
      }),
      'utf8',
    );
    await writeFile(join(project, 'tsconfig.json'), TSCONFIG, 'utf8');

    await installPackage(project, '@lsw-abpvue/identity', {
      exports: {
        '.': { import: './dist/index.js' },
        './config': { import: './dist/config/index.js' },
        './proxy': { import: './dist/proxy/index.js' },
        './package.json': './package.json',
      },
      directories: ['src', 'config/src', 'proxy/src'],
    });
    await installPackage(project, '@lsw-abpvue/core', {
      exports: { '.': { import: './dist/index.js' } },
      directories: ['src'],
    });
  });

  afterEach(async () => {
    await rm(project, { recursive: true, force: true });
  });

  const tsconfig = async () =>
    JSON.parse(
      (await readFile(join(project, 'tsconfig.json'), 'utf8')).replace(/\/\/[^\n]*/g, ''),
    ) as { compilerOptions: { paths: Record<string, string[]> } };

  it('copies every entry point the package declares', async () => {
    const result = await releaseSourceCode({ project, packages: ['@lsw-abpvue/identity'] });

    expect(result.released.map(entry => entry.path)).toEqual(['packages/identity']);
    expect(
      await readFile(join(project, 'packages/identity/config/src/index.ts'), 'utf8'),
    ).toContain('@lsw-abpvue/identity');
  });

  it('shadows the npm package with a path, so not one import has to change', async () => {
    await releaseSourceCode({ project, packages: ['@lsw-abpvue/identity'] });

    expect((await tsconfig()).compilerOptions.paths).toEqual({
      '@lsw-abpvue/identity': ['./packages/identity/src/index.ts'],
      '@lsw-abpvue/identity/config': ['./packages/identity/config/src/index.ts'],
      '@lsw-abpvue/identity/proxy': ['./packages/identity/proxy/src/index.ts'],
    });
  });

  it('edits the tsconfig through its syntax tree, so the comments survive', async () => {
    await releaseSourceCode({ project, packages: ['@lsw-abpvue/identity'] });

    expect(await readFile(join(project, 'tsconfig.json'), 'utf8')).toContain(
      '// Where a released package is picked up from.',
    );
  });

  it('leaves the dependency in place, since the path already shadows it', async () => {
    await releaseSourceCode({ project, packages: ['@lsw-abpvue/identity'] });
    const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(manifest.dependencies['@lsw-abpvue/identity']).toBe('1.2.3');
  });

  it('takes over what the released source imports and the project did not have', async () => {
    await installPackage(project, '@lsw-abpvue/theme-basic', {
      exports: { '.': { import: './dist/index.js' } },
      directories: ['src'],
      // A dependency of the package lives under the package, and released source sits
      // outside it -- so the project has to depend on it now.
      dependencies: { 'reka-ui': '^2.10.4', vue: '^3.5.0' },
    });
    await writeFile(
      join(project, 'package.json'),
      JSON.stringify({ dependencies: { '@lsw-abpvue/theme-basic': '1.2.3', vue: '^3.5.41' } }),
      'utf8',
    );

    const result = await releaseSourceCode({ project, packages: ['@lsw-abpvue/theme-basic'] });
    const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(result.added).toEqual({ 'reka-ui': '^2.10.4' });
    expect(manifest.dependencies).toEqual({
      '@lsw-abpvue/theme-basic': '1.2.3',
      vue: '^3.5.41',
      'reka-ui': '^2.10.4',
    });
  });

  it('records what was taken over and when', async () => {
    await releaseSourceCode({ project, packages: ['@lsw-abpvue/identity'] });

    expect((await readSourceCodeRecord(project)).packages['@lsw-abpvue/identity']).toMatchObject({
      name: '@lsw-abpvue/identity',
      version: '1.2.3',
      path: 'packages/identity',
    });
  });

  it('leaves the layers a provider replaces on npm when asked for all', async () => {
    expect(await releasablePackages(project)).toEqual(['@lsw-abpvue/identity']);

    const result = await releaseSourceCode({ project, packages: ['all'] });

    expect(result.released.map(entry => entry.name)).toEqual(['@lsw-abpvue/identity']);
  });

  it('adds a named package to all, rather than being replaced by it', async () => {
    const result = await releaseSourceCode({
      project,
      packages: ['all', '@lsw-abpvue/core'],
    });

    expect(result.released.map(entry => entry.name).sort()).toEqual([
      '@lsw-abpvue/core',
      '@lsw-abpvue/identity',
    ]);
  });

  it('releases a framework package all the same when it is named', async () => {
    const result = await releaseSourceCode({ project, packages: ['@lsw-abpvue/core'] });

    expect(result.released.map(entry => entry.name)).toEqual(['@lsw-abpvue/core']);
  });

  it('says which package was not installed rather than stopping', async () => {
    const result = await releaseSourceCode({ project, packages: ['@lsw-abpvue/theme-basic'] });

    expect(result).toMatchObject({ released: [], missing: ['@lsw-abpvue/theme-basic'] });
  });

  it('says so when a package was published without its source', async () => {
    await installPackage(project, '@lsw-abpvue/theme-basic', {
      exports: { '.': { import: './dist/index.js' } },
      directories: [],
    });

    await expect(
      releaseSourceCode({ project, packages: ['@lsw-abpvue/theme-basic'] }),
    ).rejects.toThrow(CliError);
  });

  it('says what it would take over without taking it over', async () => {
    const result = await releaseSourceCode({
      project,
      packages: ['@lsw-abpvue/identity'],
      dryRun: true,
    });

    expect(result.paths['@lsw-abpvue/identity']).toEqual(['./packages/identity/src/index.ts']);
    expect((await tsconfig()).compilerOptions.paths).toEqual({});
    expect((await readSourceCodeRecord(project)).packages).toEqual({});
  });
});
