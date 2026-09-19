import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { moduleBlocks, readTemplateManifest } from './manifest.js';
import { templateRoot } from './paths.js';
import { filterBlocks, packageNameOf, renderTemplate, type RenderOptions } from './render.js';

const source = templateRoot();

const VALUES = {
  projectName: 'Acme.BookStore',
  appName: 'BookStore',
  clientId: 'BookStore_App',
  apiUrl: 'https://localhost:44335',
  authUrl: 'https://localhost:44335',
  appUrl: 'http://localhost:4200',
};

describe('filterBlocks', () => {
  const text = ['keep', '// abpv:begin identity', 'identity', '// abpv:end identity', 'keep too'];

  it('keeps what was asked for and takes the markers away with it', () => {
    expect(filterBlocks(text.join('\n'), new Set(['identity']), 'x.ts')).toBe(
      'keep\nidentity\nkeep too',
    );
  });

  it('drops the body of a block nobody asked for', () => {
    expect(filterBlocks(text.join('\n'), new Set(), 'x.ts')).toBe('keep\nkeep too');
  });

  it('refuses a block that is never closed', () => {
    expect(() => filterBlocks('// abpv:begin identity\n', new Set(), 'x.ts')).toThrow(CliError);
  });

  it('refuses an end that closes something else', () => {
    const crossed = '// abpv:begin a\n// abpv:end b\n';

    expect(() => filterBlocks(crossed, new Set(['a', 'b']), 'x.ts')).toThrow(CliError);
  });
});

describe('packageNameOf', () => {
  it('is a name npm accepts', () => {
    expect(packageNameOf('Acme.BookStore')).toBe('acme-bookstore');
  });
});

describe('renderTemplate', () => {
  let target: string;

  beforeEach(async () => {
    target = await mkdtemp(join(tmpdir(), 'abpvue-template-'));
  });

  afterEach(async () => {
    await rm(target, { recursive: true, force: true });
  });

  const render = (overrides: Partial<RenderOptions> = {}) =>
    renderTemplate({
      source,
      target,
      values: VALUES,
      blocks: [],
      version: '1.2.3',
      ...overrides,
    });

  const read = (path: string) => readFile(join(target, path), 'utf8');

  it('leaves no placeholder behind in any file it writes', async () => {
    const manifest = await readTemplateManifest(source);
    const { written } = await render({ blocks: Object.keys(manifest.blocks) });

    for (const path of written) {
      expect(`${path}: ${await read(path)}`).not.toMatch(/__[A-Z0-9_]+__/);
    }
  });

  it('leaves no block marker behind either', async () => {
    const { written } = await render({ blocks: ['identity'] });

    for (const path of written) expect(`${path}: ${await read(path)}`).not.toContain('abpv:');
  });

  it('wires up the modules that were asked for and no others', async () => {
    await render({ blocks: ['identity'] });
    const main = await read('src/main.ts');

    expect(main).toContain('provideIdentityConfig()');
    expect(main).not.toContain('provideTenantManagementConfig()');
  });

  it('takes the files of a block away with the block', async () => {
    const { written } = await render({ blocks: [] });

    expect(written).not.toContain('src/pages/BooksPage.vue');
    expect(await read('src/routes.ts')).not.toContain('BooksPage');
  });

  it('keeps the sample page when it was asked for', async () => {
    const { written } = await render({ blocks: ['sample-crud'] });

    expect(written).toContain('src/pages/BooksPage.vue');
  });

  it('never writes the template manifest into a project', async () => {
    const { written } = await render();

    expect(written).not.toContain('template.json');
  });

  it('turns the workspace ranges into the version doing the rendering', async () => {
    await render();
    const manifest = JSON.parse(await read('package.json')) as {
      name: string;
      private?: boolean;
      dependencies: Record<string, string>;
    };

    expect(manifest.name).toBe('acme-bookstore');
    expect(manifest.private).toBeUndefined();
    expect(manifest.dependencies['@lsw-abpvue/core']).toBe('1.2.3');
    expect(Object.values(manifest.dependencies)).not.toContain('workspace:*');
  });

  it('points the application at the backend it was told about', async () => {
    await render();

    expect(JSON.parse(await read('public/dynamic-env.json'))).toMatchObject({
      apis: { default: { url: 'https://localhost:44335' } },
      oAuthConfig: { clientId: 'BookStore_App', redirectUri: 'http://localhost:4200' },
    });
  });

  it('writes the dotfiles under the names a project reads them by', async () => {
    const { written } = await render();

    expect(written).toContain('.env.development');
    expect(await read('.env.development')).toContain('VITE_API_URL=https://localhost:44335');
  });

  it('says what it would write without writing it', async () => {
    const { written } = await render({ dryRun: true });

    expect(written).toContain('src/main.ts');
    await expect(read('src/main.ts')).rejects.toThrow();
  });

  it('refuses a block the template has never heard of', async () => {
    await expect(render({ blocks: ['crm'] })).rejects.toThrow(CliError);
  });

  it('lists the module UIs the template can wire up', async () => {
    expect(moduleBlocks(await readTemplateManifest(source))).toContain('identity');
  });
});
