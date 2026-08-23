import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { workspaceAliases } from './workspace-aliases.ts';

const packagesRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../packages');

describe('workspaceAliases', () => {
  const aliases = workspaceAliases(packagesRoot);

  it('把每个包的主入口指到源码', () => {
    expect(aliases['@lsw-abpvue/utils']).toBe(resolve(packagesRoot, 'utils/src/index.ts'));
  });

  it('只收 exports 里声明过的入口', () => {
    expect(aliases).not.toHaveProperty('@lsw-abpvue/utils/package.json');
  });

  it('二级入口排在主入口前面，否则 Vite 会按前缀先匹配到主入口', () => {
    const keys = Object.keys(aliases);

    for (const key of keys) {
      const parent = keys.find(other => other !== key && key.startsWith(`${other}/`));
      if (!parent) continue;

      expect(keys.indexOf(key)).toBeLessThan(keys.indexOf(parent));
    }
  });
});
