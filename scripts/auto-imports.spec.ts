import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { createServer } from 'vite';
import { expect, it } from 'vitest';
import { templateRoot } from '../packages/cli/src/template/paths.js';
import { renderTemplate } from '../packages/cli/src/template/render.js';

const run = promisify(execFile);

it('a fresh application typechecks and imports only the common APIs it uses', async () => {
  const target = await mkdtemp(join(tmpdir(), 'abpvue-auto-imports-'));
  const source = templateRoot();
  try {
    await renderTemplate({
      source,
      target,
      values: {
        projectName: 'Acme.BookStore',
        appName: 'BookStore',
        clientId: 'BookStore_App',
        apiUrl: 'https://localhost:44335',
        authUrl: 'https://localhost:44335',
        appUrl: 'http://localhost:4200',
      },
      blocks: ['sample-crud'],
      version: '1.2.3',
    });
    await symlink(join(source, 'node_modules'), join(target, 'node_modules'), 'dir');
    const declarations = await readFile(join(target, 'auto-imports.d.ts'), 'utf8');
    const globals = [...declarations.matchAll(/const (\w+): typeof import\(/g)].map(
      match => match[1],
    );
    await writeFile(
      join(target, 'src/auto-import-check.ts'),
      [
        'export const page: PagedResultDto<EntityDto<string>> = { items: [], totalCount: 0 };',
        'export const count: Ref<number> = ref(0);',
        'export const local = inject;',
        'export const abp = () => injectAbp(RestService);',
        'type IsAny<T> = 0 extends 1 & T ? true : false;',
        `export const typed: [${globals.map(name => `IsAny<typeof ${name}>`).join(', ')}] = [${globals.map(() => 'false').join(', ')}];`,
        '// @ts-expect-error -- the declaration must preserve the number type',
        "count.value = 'invalid';",
      ].join('\n'),
    );
    await run(
      process.execPath,
      [join(source, 'node_modules/vue-tsc/bin/vue-tsc.js'), '-p', 'tsconfig.json'],
      {
        cwd: target,
      },
    ).catch((error: Error & { stdout?: string; stderr?: string }) => {
      throw new Error([error.message, error.stdout, error.stderr].join('\n'), { cause: error });
    });

    await mkdir(join(target, 'src/components'), { recursive: true });
    await writeFile(
      join(target, 'src/components/LocalCard.vue'),
      '<template><div>Local</div></template>',
    );
    await writeFile(
      join(target, 'src/AutoImportPage.vue'),
      '<script setup lang="ts">const count = ref(0);</script>\n' +
        '<template><LocalCard /><abp-button @click="count++">{{ count }}</abp-button></template>',
    );
    await writeFile(
      join(target, 'src/local-binding.ts'),
      'const ref = () => 42; export const answer = ref();',
    );
    await mkdir(join(target, 'packages/example/src'), { recursive: true });
    await writeFile(join(target, 'packages/example/src/page.ts'), 'export const count = ref(0);');

    const server = await createServer({
      root: target,
      logLevel: 'silent',
      server: { middlewareMode: true },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    try {
      const script = await server.transformRequest('/src/auto-import-check.ts');
      expect(script?.code).toMatch(/inject as injectAbp/);
      expect(script?.code).toContain('RestService');
      expect(script?.code).toMatch(/import \{[^}]*\binject\b[^}]*\} from [^\n]*vue/);
      expect(script?.code).not.toContain('useListService');

      const page = await server.transformRequest('/src/AutoImportPage.vue');
      expect(page?.code).toContain('theme-shared');
      expect(page?.code).toContain('LocalCard.vue');
      expect(page?.code).not.toContain('theme-basic');
      expect(page?.code).not.toContain('resolveComponent("abp-button")');
      expect((await server.transformRequest('/src/local-binding.ts'))?.code).not.toContain('from ');
      expect((await server.transformRequest('/packages/example/src/page.ts'))?.code).not.toContain(
        'from ',
      );

      const books = await server.transformRequest('/src/pages/BooksPage.vue');
      expect(books?.code).toContain('inject as injectAbp');
      expect(books?.code).toContain('useRecordEditor');
      expect(books?.code).not.toContain('resolveComponent("AbpPage")');
      expect(await readFile(join(target, 'components.d.ts'), 'utf8')).toContain('LocalCard');
    } finally {
      await server.close();
    }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
}, 20_000);
