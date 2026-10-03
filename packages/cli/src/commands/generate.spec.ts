import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runGenerate, type GenerateArgs } from './generate.js';
import { runProxy } from './proxy.js';

const FIXTURES = resolve(import.meta.dirname, '../../../../e2e/fixtures');
const projects: string[] = [];

const ROUTES = [
  "import type { RouteRecordRaw } from 'vue-router';",
  "import HomePage from './pages/HomePage.vue';",
  '',
  'export const routes: RouteRecordRaw[] = [',
  "  { path: '/', component: HomePage, meta: { routes: { name: 'Home', order: 1 } } },",
  '];',
  '',
].join('\n');

/** A project with a proxy in it, which is what a generated page is built on. */
async function project(modules = 'multi-tenancy,app'): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'abpvue-generate-'));
  projects.push(cwd);

  await runProxy('add', {
    cwd,
    target: 'src/proxy',
    module: modules,
    source: join(FIXTURES, 'api-definition.json'),
    'config-source': join(FIXTURES, 'application-configuration.json'),
  });

  await mkdir(join(cwd, 'src'), { recursive: true });
  await writeFile(join(cwd, 'src/routes.ts'), ROUTES, 'utf8');

  return cwd;
}

afterEach(async () => {
  await Promise.all(
    projects.splice(0).map(directory => rm(directory, { recursive: true, force: true })),
  );
});

function args(cwd: string, extra: Partial<GenerateArgs> = {}): GenerateArgs {
  return {
    cwd,
    entity: 'Tenant',
    target: 'src/pages',
    proxy: 'src/proxy',
    routes: 'src/routes.ts',
    source: join(FIXTURES, 'api-definition.json'),
    'config-source': join(FIXTURES, 'application-configuration.json'),
    ...extra,
  };
}

const read = (cwd: string, path: string): Promise<string> => readFile(join(cwd, path), 'utf8');

describe('generate', () => {
  it('reports an invalid application manifest before writing a page', async () => {
    const cwd = await project();
    await writeFile(join(cwd, 'package.json'), '{');
    await expect(runGenerate(args(cwd))).rejects.toThrow('fix the JSON in package.json');
    await expect(read(cwd, 'src/pages/TenantsPage.vue')).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('uses the application automatic import setting and allows explicit imports', async () => {
    const cwd = await project();
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ abpVue: { autoImports: true } }));
    await runGenerate(args(cwd));
    expect(await read(cwd, 'src/pages/TenantsPage.vue')).not.toContain("from '@lsw-abpvue/");
    await expect(read(cwd, 'src/pages/tenants.extensions.ts')).rejects.toMatchObject({
      code: 'ENOENT',
    });

    await runGenerate(args(cwd, { force: true, 'auto-imports': false }));
    expect(await read(cwd, 'src/pages/TenantsPage.vue')).toContain("from '@lsw-abpvue/core'");
    expect(await read(cwd, 'src/pages/TenantsPage.vue')).toContain("from '@lsw-abpvue/components'");
  });
  it('writes an application page and its route', async () => {
    const cwd = await project();
    const result = await runGenerate(args(cwd));

    expect(result.files.map(file => `${file.path} ${file.action}`)).toEqual([
      'src/pages/TenantsPage.vue created',
      'src/routes.ts updated',
    ]);

    const page = await read(cwd, 'src/pages/TenantsPage.vue');

    expect(page).toContain("import { TenantService } from '../proxy/volo/abp/tenant-management'");
    expect(page).toContain('async function save()');
    expect(page).toContain('<AbpDataTable');
    expect(await read(cwd, 'src/routes.ts')).toContain("path: '/tenants'");
  });

  it('keeps form controls and commands directly editable in the page', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));
    const page = await read(cwd, 'src/pages/TenantsPage.vue');
    expect(page.startsWith('<template>')).toBe(true);
    expect(page).toContain('useAbpForm');
    expect(page).toContain('form.controls.name');
    expect(page).not.toContain('registerTenantsExtensions');
    expect(page).not.toContain('useRecordEditor');
  });

  it('a dry run writes nothing', async () => {
    const cwd = await project();
    const result = await runGenerate(args(cwd, { 'dry-run': true }));

    expect(result.files).toHaveLength(2);
    await expect(read(cwd, 'src/pages/TenantsPage.vue')).rejects.toThrow();
  });

  it('leaves a page that is already there alone', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));
    await writeFile(join(cwd, 'src/pages/TenantsPage.vue'), '<!-- mine now -->\n', 'utf8');

    const again = await runGenerate(args(cwd));

    expect(again.files[0]?.action).toBe('kept');
    expect(await read(cwd, 'src/pages/TenantsPage.vue')).toBe('<!-- mine now -->\n');
  });

  it('--force replaces the page and leaves legacy extension files alone', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));
    await writeFile(join(cwd, 'src/pages/TenantsPage.vue'), '<!-- customized -->');
    const legacy = 'export const MINE = 1;\n';
    await writeFile(join(cwd, 'src/pages/tenants.extensions.ts'), legacy);
    await runGenerate(args(cwd, { force: true }));
    expect(await read(cwd, 'src/pages/TenantsPage.vue')).toContain('async function save()');
    expect(await read(cwd, 'src/pages/tenants.extensions.ts')).toBe(legacy);
  });

  it('running it twice changes nothing the second time', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));
    const before = await read(cwd, 'src/routes.ts');

    const again = await runGenerate(args(cwd, { force: true }));

    expect(again.files.every(file => file.action === 'unchanged')).toBe(true);
    expect(await read(cwd, 'src/routes.ts')).toBe(before);
  });

  it('keeps a template route when generating its existing page, including with force', async () => {
    const cwd = await project('app');
    const originalRoutes = ROUTES.replace(
      '];',
      "  { path: '/books', component: () => import('./pages/BooksPage.vue'), meta: { routes: { name: 'My books', order: 2 } } },\n];",
    );
    await writeFile(join(cwd, 'src/routes.ts'), originalRoutes);
    await mkdir(join(cwd, 'src/pages'), { recursive: true });
    await writeFile(join(cwd, 'src/pages/BooksPage.vue'), '<!-- template page -->\n');

    for (const force of [false, true]) {
      await runGenerate(args(cwd, { entity: 'Book', force }));
      const source = await read(cwd, 'src/routes.ts');
      expect([...source.matchAll(/path: '\/books'/g)]).toHaveLength(1);
      expect(source).toContain("name: 'My books'");
      expect(source).not.toContain('abpv:begin route:books');
    }
  });

  it('--no-router leaves the routes file out of it', async () => {
    const cwd = await project();
    const result = await runGenerate(args(cwd, { router: false }));

    expect(result.files.map(file => file.path)).not.toContain('src/routes.ts');
    expect(await read(cwd, 'src/routes.ts')).toBe(ROUTES);
  });

  it('refuses an entity whose module has no proxy, rather than importing a directory that is not there', async () => {
    const cwd = await project('identity');

    // The type pool describes every module, so the names resolve; the files only exist
    // for the modules the proxy was generated from.
    await expect(runGenerate(args(cwd, { entity: 'Book' }))).rejects.toThrow(
      /abpv proxy add --module app/,
    );
  });

  it('refuses to generate a page onto a proxy that is not there', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'abpvue-generate-'));
    projects.push(cwd);

    await expect(runGenerate(args(cwd))).rejects.toThrow(/proxy add/);
  });

  it('takes the localization resource from the backend', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));

    // `defaultResourceName` in the application configuration, not the entity's name.
    expect(await read(cwd, 'src/pages/TenantsPage.vue')).toContain("'BookStore.TenantsComponent'");
  });

  it('generates direct controls for the BookStore tutorial entity', async () => {
    const cwd = await project('app');
    await runGenerate(args(cwd, { entity: 'Book' }));
    const page = await read(cwd, 'src/pages/BooksPage.vue');
    expect(page).toContain("import { BookService } from '../proxy/book-store/books'");
    expect(page).toContain('BookStore::BookDeletionConfirmationMessage');
    expect(page).toContain('list.filter.value');
    expect(page).toContain('form.controls.publishDate');
    expect(page).toContain('BookStore::Enum:BookType.');
    expect(page).toContain('Validators.range(0, 1000)');
    expect(page).toContain('BookStore.Books.Create');
    expect(page).not.toContain('getObjectExtensionEntities');
    await expect(read(cwd, 'src/pages/books.extensions.ts')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('finds an entity in another module when told which one', async () => {
    const cwd = await project('identity,multi-tenancy');
    await runGenerate(args(cwd, { entity: 'IdentityUser', module: 'identity' }));

    expect(await read(cwd, 'src/pages/IdentityUsersPage.vue')).toContain('IdentityUserService');
  });

  it('refuses a path that would write outside the project', async () => {
    const cwd = await project();

    for (const extra of [{ target: '../elsewhere' }, { proxy: '/tmp' }, { routes: '../r.ts' }]) {
      await expect(runGenerate(args(cwd, extra))).rejects.toThrow(/inside the project/);
    }
  });

  it('refuses a page path occupied by a directory without changing routes', async () => {
    const cwd = await project();

    await mkdir(join(cwd, 'src/pages/TenantsPage.vue'), { recursive: true });
    await expect(runGenerate(args(cwd))).rejects.toThrow(/Could not write the page/);
    expect(await read(cwd, 'src/routes.ts')).toBe(ROUTES);
  });
});
