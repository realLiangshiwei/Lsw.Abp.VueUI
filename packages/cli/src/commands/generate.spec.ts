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
    expect(await read(cwd, 'src/pages/tenants.extensions.ts')).not.toContain("from '@lsw-abpvue/");

    await runGenerate(args(cwd, { force: true, 'auto-imports': false }));
    expect(await read(cwd, 'src/pages/TenantsPage.vue')).toContain("from '@lsw-abpvue/core'");
    expect(await read(cwd, 'src/pages/tenants.extensions.ts')).toContain(
      "from '@lsw-abpvue/components'",
    );
  });
  it('writes the page, its extensions and the route', async () => {
    const cwd = await project();
    const result = await runGenerate(args(cwd));

    expect(result.files.map(file => `${file.path} ${file.action}`)).toEqual([
      'src/pages/TenantsPage.vue created',
      'src/pages/tenants.extensions.ts created',
      'src/routes.ts updated',
    ]);

    const page = await read(cwd, 'src/pages/TenantsPage.vue');

    expect(page).toContain("import { TenantService } from '../proxy/volo/abp/tenant-management'");
    expect(page).toContain('useRecordEditor<TenantDto>');
    expect(page).toContain('<AbpExtensibleTable');
    expect(await read(cwd, 'src/routes.ts')).toContain("path: '/tenants'");
  });

  it('the page is the short one: the columns and the fields are next door', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));

    const page = await read(cwd, 'src/pages/TenantsPage.vue');
    const extensions = await read(cwd, 'src/pages/tenants.extensions.ts');

    // The React template's BooksPage.tsx is 438 lines (design 09). The ratio is the
    // point of the whole extension system, so it is a test rather than a claim.
    expect(page.split('\n').length).toBeLessThan(438 / 6);
    expect(extensions).toContain('EntityProp.createMany<TenantDto>');
    expect(extensions).toContain('FormProp.createMany<TenantDto>');
  });

  it('a dry run writes nothing', async () => {
    const cwd = await project();
    const result = await runGenerate(args(cwd, { 'dry-run': true }));

    expect(result.files).toHaveLength(3);
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

  it('--force rewrites the generated blocks and keeps what is outside them', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));

    const path = 'src/pages/tenants.extensions.ts';
    const edited = `${await read(cwd, path)}\nexport const MINE = 1;\n`;
    await writeFile(join(cwd, path), edited, 'utf8');

    await runGenerate(args(cwd, { force: true }));
    const merged = await read(cwd, path);

    expect(merged).toContain('export const MINE = 1;');
    expect(merged).toContain('EntityProp.createMany<TenantDto>');
  });

  it('running it twice changes nothing the second time', async () => {
    const cwd = await project();
    await runGenerate(args(cwd));
    const before = await read(cwd, 'src/routes.ts');

    const again = await runGenerate(args(cwd, { force: true }));

    expect(again.files.every(file => file.action === 'unchanged')).toBe(true);
    expect(await read(cwd, 'src/routes.ts')).toBe(before);
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
    expect(await read(cwd, 'src/pages/tenants.extensions.ts')).toContain(
      "'BookStore.TenantsComponent'",
    );
  });

  it('generates the page ABP’s own BookStore tutorial entity gets', async () => {
    const cwd = await project('app');
    await runGenerate(args(cwd, { entity: 'Book' }));

    const page = await read(cwd, 'src/pages/BooksPage.vue');
    const extensions = await read(cwd, 'src/pages/books.extensions.ts');

    // The number the whole extension system is measured by: the React template's
    // hand-written BooksPage.tsx is 438 lines (design 09).
    expect(page.split('\n').length).toBeLessThan(438 / 6);

    expect(page).toContain("import { BookService } from '../proxy/book-store/books'");
    expect(page).toContain("deletionMessage: 'BookStore::BookDeletionConfirmationMessage'");
    expect(page).toContain('searchable');

    // Four columns, the enum among them, localized the way ABP names enum members.
    expect(extensions).toContain("name: 'publishDate'");
    expect(extensions).toContain('`BookStore::Enum:BookType.${value}`');
    expect(extensions).toContain('Validators.range(0, 1000)');

    // The permissions the controller carries, and the object extensions the backend
    // declares for the entity.
    expect(extensions).toContain("permission: 'BookStore.Books.Create'");
    expect(extensions).toContain("getObjectExtensionEntities(injector, 'BookStore')");
    expect(extensions).toContain('{ [BOOKS]: entities.Book }');
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

  it('takes back what it wrote when one of the files cannot be written', async () => {
    const cwd = await project();

    // A directory where the extensions file has to go: writing it fails, and the page
    // written before it has to go back.
    await mkdir(join(cwd, 'src/pages/tenants.extensions.ts'), { recursive: true });

    await expect(runGenerate(args(cwd))).rejects.toThrow(/Could not write the page/);
    await expect(read(cwd, 'src/pages/TenantsPage.vue')).rejects.toThrow();
    expect(await read(cwd, 'src/routes.ts')).toBe(ROUTES);
  });
});
