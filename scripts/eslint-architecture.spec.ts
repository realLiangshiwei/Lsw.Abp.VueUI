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

describe('架构依赖规则', () => {
  it.each([
    ['packages/utils/src/a.ts', 'vue'],
    ['packages/core/src/a.ts', '@lsw-abpvue/theme-shared'],
    ['packages/core/src/a.ts', 'reka-ui'],
    ['packages/theme-shared/src/a.ts', 'reka-ui'],
    ['packages/theme-shared/src/a.ts', '@lsw-abpvue/components'],
    ['packages/components/src/a.ts', '@lsw-abpvue/theme-basic'],
    ['packages/identity/src/a.ts', '@lsw-abpvue/theme-basic'],
    ['packages/oauth/src/a.ts', '@lsw-abpvue/identity'],
  ])('%s 不许 import %s', async (path, specifier) => {
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
  ])('%s 可以 import %s', async (path, specifier) => {
    await expect(ruleIdsFor(path, anImport(specifier))).resolves.not.toContain(
      'no-restricted-imports',
    );
  });

  it('测试文件额外放行测试工具链', async () => {
    await expect(
      ruleIdsFor('packages/theme-shared/src/a.spec.ts', anImport('@vue/test-utils')),
    ).resolves.not.toContain('no-restricted-imports');

    await expect(
      ruleIdsFor('packages/theme-shared/src/a.spec.ts', anImport('reka-ui')),
    ).resolves.toContain('no-restricted-imports');
  });
});

describe('SSR 纪律', () => {
  const readsTheDom = 'export const width = window.innerWidth;\n';

  it('core 里碰 window 会被拦下', async () => {
    await expect(ruleIdsFor('packages/core/src/a.ts', readsTheDom)).resolves.toContain(
      'no-restricted-globals',
    );
  });

  it('平台服务是唯一的出口', async () => {
    await expect(
      ruleIdsFor('packages/core/src/services/platform/window.service.ts', readsTheDom),
    ).resolves.not.toContain('no-restricted-globals');
  });

  it('别的包不受这条规则约束', async () => {
    await expect(ruleIdsFor('packages/theme-basic/src/a.ts', readsTheDom)).resolves.not.toContain(
      'no-restricted-globals',
    );
  });
});
