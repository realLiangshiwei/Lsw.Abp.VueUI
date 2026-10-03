import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: repoRoot });
});

async function ruleIdsFor(path: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, {
    filePath: join(repoRoot, path),
    warnIgnored: false,
  });

  return (result?.messages ?? []).map(message => message.ruleId ?? 'unknown');
}

const anImport = (from: string) => `import { thing } from '${from}';\nexport const used = thing;\n`;

describe('the layer dependency rule', () => {
  it.each([
    ['packages/utils/src/a.ts', 'vue'],
    ['packages/core/src/a.ts', '@lsw-abpvue/theme-shared'],
    ['packages/core/src/a.ts', 'reka-ui'],
    ['packages/theme-shared/src/a.ts', 'reka-ui'],
    ['packages/theme-shared/src/a.ts', '@lsw-abpvue/components'],
    ['packages/components/src/a.ts', '@lsw-abpvue/theme-basic'],
    ['packages/identity/src/a.ts', '@lsw-abpvue/theme-basic'],
    ['packages/oauth/src/a.ts', '@lsw-abpvue/identity'],
  ])('%s may not import %s', async (path, specifier) => {
    await expect(ruleIdsFor(path, anImport(specifier))).resolves.toContain('no-restricted-imports');
  });

  it.each([
    ['packages/core/src/a.ts', '@lsw-abpvue/utils'],
    ['packages/core/src/a.ts', 'vue'],
    ['packages/theme-shared/src/a.ts', '@lsw-abpvue/core'],
    ['packages/components/src/a.ts', '@tanstack/vue-table'],
    ['packages/theme-basic/src/a.ts', 'reka-ui'],
    ['packages/identity/src/a.ts', '@lsw-abpvue/permission-management'],
    ['packages/utils/src/a.ts', './sibling'],
    ['packages/utils/src/a.ts', '../parent'],
  ])('%s may import %s', async (path, specifier) => {
    await expect(ruleIdsFor(path, anImport(specifier))).resolves.not.toContain(
      'no-restricted-imports',
    );
  });

  it('test files additionally allow the test tooling', async () => {
    await expect(
      ruleIdsFor('packages/theme-shared/src/a.spec.ts', anImport('@vue/test-utils')),
    ).resolves.not.toContain('no-restricted-imports');

    await expect(
      ruleIdsFor('packages/theme-shared/src/a.spec.ts', anImport('reka-ui')),
    ).resolves.toContain('no-restricted-imports');
  });
});

describe('SSR discipline', () => {
  const readsTheDom = 'export const width = window.innerWidth;\n';

  it('reaching for window inside core is refused', async () => {
    await expect(ruleIdsFor('packages/core/src/a.ts', readsTheDom)).resolves.toContain(
      'no-restricted-globals',
    );
  });

  it('the platform services are the only way out', async () => {
    await expect(
      ruleIdsFor('packages/core/src/services/platform/window.service.ts', readsTheDom),
    ).resolves.not.toContain('no-restricted-globals');
  });

  it('another package is not bound by this rule', async () => {
    await expect(ruleIdsFor('packages/theme-basic/src/a.ts', readsTheDom)).resolves.not.toContain(
      'no-restricted-globals',
    );
  });
});

describe('the injection context', () => {
  const inAsyncFn = (body: string) => `export async function load() {\n  ${body}\n}\n`;

  it('an automatically imported ABP inject after an await is refused', async () => {
    await expect(
      ruleIdsFor(
        'templates/app/src/pages/example.ts',
        inAsyncFn('await Promise.resolve();\n  return injectAbp(RestService);'),
      ),
    ).resolves.toContain('abp/no-inject-after-await');
  });

  it('an inject after an await is refused', async () => {
    await expect(
      ruleIdsFor(
        'packages/core/src/a.ts',
        inAsyncFn('await Promise.resolve();\n  const svc = inject(RestService);\n  return svc;'),
      ),
    ).resolves.toContain('abp/no-inject-after-await');
  });

  it('an inject before an await is fine', async () => {
    await expect(
      ruleIdsFor(
        'packages/core/src/a.ts',
        inAsyncFn('const svc = inject(RestService);\n  await Promise.resolve();\n  return svc;'),
      ),
    ).resolves.not.toContain('abp/no-inject-after-await');
  });

  it('capturing the injector before the await is the recommended shape and is not reported', async () => {
    await expect(
      ruleIdsFor(
        'packages/core/src/a.ts',
        inAsyncFn(
          'const injector = getCurrentInjector();\n  await Promise.resolve();\n  return injector.get(RestService);',
        ),
      ),
    ).resolves.not.toContain('abp/no-inject-after-await');
  });

  it('a provideAbp after an await in the same function is refused too', async () => {
    await expect(
      ruleIdsFor(
        'packages/core/src/a.ts',
        inAsyncFn('await Promise.resolve();\n  provideAbp([]);'),
      ),
    ).resolves.toContain('abp/no-inject-after-await');
  });

  it('an inject in a nested function has nothing to do with the outer await', async () => {
    await expect(
      ruleIdsFor(
        'packages/core/src/a.ts',
        inAsyncFn('await Promise.resolve();\n  return () => inject(RestService);'),
      ),
    ).resolves.not.toContain('abp/no-inject-after-await');
  });

  it('a top-level await puts what follows out of bounds', async () => {
    await expect(
      ruleIdsFor(
        'packages/core/src/a.ts',
        'await Promise.resolve();\nexport const svc = inject(RestService);\n',
      ),
    ).resolves.toContain('abp/no-inject-after-await');
  });
});

describe('secondary entry points', () => {
  it('a package may import its own main entry by package name', async () => {
    await expect(
      ruleIdsFor('packages/core/router/src/a.ts', anImport('@lsw-abpvue/core')),
    ).resolves.not.toContain('no-restricted-imports');
  });

  it('but another package is still held to the rule', async () => {
    await expect(
      ruleIdsFor('packages/core/router/src/a.ts', anImport('@lsw-abpvue/theme-shared')),
    ).resolves.toContain('no-restricted-imports');
  });
});
