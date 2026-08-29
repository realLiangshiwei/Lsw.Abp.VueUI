import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { workspaceAliases } from './workspace-aliases.ts';

const packagesRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../packages');

describe('workspaceAliases', () => {
  const aliases = workspaceAliases(packagesRoot);

  it('points the main entry of each package at its source', () => {
    expect(aliases['@lsw-abpvue/utils']).toBe(resolve(packagesRoot, 'utils/src/index.ts'));
  });

  it('takes only the entry points the exports map declares', () => {
    expect(aliases).not.toHaveProperty('@lsw-abpvue/utils/package.json');
  });

  it('a secondary entry comes before the main one, or Vite would match the prefix first', () => {
    const keys = Object.keys(aliases);

    for (const key of keys) {
      const parent = keys.find(other => other !== key && key.startsWith(`${other}/`));
      if (!parent) continue;

      expect(keys.indexOf(key)).toBeLessThan(keys.indexOf(parent));
    }
  });
});
