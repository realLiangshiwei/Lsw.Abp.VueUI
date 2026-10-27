import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import { moduleBlocks, readTemplateManifest } from './manifest.js';
import { templateRoot } from './paths.js';
import { selectModules } from './modules.js';
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

  it('filters Vue template blocks with HTML comments', () => {
    const template =
      '<main>\n<!-- abpv:begin gdpr -->\n<Consent />\n<!-- abpv:end gdpr -->\n</main>';
    expect(filterBlocks(template, new Set(), 'App.vue')).toBe('<main>\n</main>');
    expect(filterBlocks(template, new Set(['gdpr']), 'App.vue')).toBe(
      '<main>\n<Consent />\n</main>',
    );
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
    const { written } = await render({ blocks: [...selectModules(manifest), 'sample-crud'] });

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

  it('wires the commercial routes, profile tabs, settings and application hosts', async () => {
    await render({
      blocks: [
        'account-pro',
        'account-pro-admin',
        'identity-pro',
        'saas',
        'audit-logging',
        'language-management',
        'text-template-management',
        'openiddict-pro',
        'gdpr',
        'setting-management',
        'feature-management',
      ],
    });
    const main = await read('src/main.ts');
    const routes = await read('src/routes.ts');
    const app = await read('src/App.vue');
    expect(main).toContain('provideIdentityProConfig()');
    expect(main).not.toContain('provideIdentityConfig()');
    expect(main).not.toContain('provideManageProfileTabs()');
    expect(main.indexOf('provideSettingManagementConfig()')).toBeLessThan(
      main.indexOf('provideAccountProAdminConfig()'),
    );
    expect(main).toContain("import '@lsw-abpvue/gdpr/style.css'");
    expect(routes).toContain('createIdentityProRoutes()');
    expect(routes).toContain('createAccountProRoutes()');
    expect(routes).toContain('createSaasRoutes()');
    expect(routes).not.toContain('createIdentityRoutes()');
    expect(routes).not.toContain('/tenant-management');
    expect(app).toContain('<EntityHistoryHost');
    expect(app).toContain('<AbpGdprCookieConsent');
  });

  it('includes the peer dependencies of a selected commercial module', async () => {
    await render({ blocks: ['identity-pro'] });
    const manifest = JSON.parse(await read('package.json'));
    expect(manifest.dependencies).toMatchObject({
      '@lsw-abpvue/identity-pro': '1.2.3',
      '@lsw-abpvue/account-pro': '1.2.3',
      '@lsw-abpvue/audit-logging': '1.2.3',
      qrcode: '1.5.4',
    });
    expect(manifest.dependencies['@lsw-abpvue/saas']).toBeUndefined();
    expect(manifest.abpVue.modules).toEqual(['identity-pro']);
    expect(await read('src/App.vue')).not.toContain('EntityHistoryHost');
  });

  it('leaves commercial dependencies and hosts out of an OSS application', async () => {
    await render({ blocks: ['account', 'identity'] });
    const manifest = JSON.parse(await read('package.json'));
    expect(manifest.dependencies['@lsw-abpvue/identity-pro']).toBeUndefined();
    expect(manifest.dependencies.qrcode).toBeUndefined();
    expect(await read('src/App.vue')).not.toContain('AbpGdprCookieConsent');
    await expect(read('src/hosts/EntityHistoryHost.vue')).rejects.toThrow();
  });

  it.each([
    ['identity', 'identity-pro'],
    ['account', 'account-pro'],
    ['tenant-management', 'saas'],
  ])('rejects simultaneous OSS and PRO registrations: %s and %s', async (base, pro) => {
    await expect(render({ blocks: [base, pro] })).rejects.toThrow('cannot be registered together');
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

  it('does not copy the workspace changelog into an application', async () => {
    const { written, contents } = await render();

    expect(written).not.toContain('CHANGELOG.md');
    expect(Object.values(contents).join('\n')).not.toContain('@lsw-abpvue/template-app');
    await expect(read('CHANGELOG.md')).rejects.toThrow();
  });

  it('names the application in its readme', async () => {
    await render();
    expect(await read('README.md')).toMatch(/^# Acme\.BookStore\n/);
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

  it('allows the Vue compatibility shim to initialize on a clean pnpm install', async () => {
    await render();

    expect(await read('pnpm-workspace.yaml')).toMatch(/allowBuilds:\s+vue-demi: true/);
  });

  it('pins the TypeScript version supported by its Vue type checker', async () => {
    await render();
    const manifest = JSON.parse(await read('package.json')) as {
      devDependencies: Record<string, string>;
    };

    expect(manifest.devDependencies.typescript).toBe('6.0.3');
  });

  it('loads Bootstrap before the theme can initialize its stylesheet', async () => {
    await render();
    const main = await read('src/main.ts');

    expect(main.indexOf("import 'bootstrap/dist/css/bootstrap.min.css'")).toBeLessThan(
      main.indexOf("from '@lsw-abpvue/theme-basic'"),
    );
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
