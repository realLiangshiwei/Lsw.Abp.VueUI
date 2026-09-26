import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The library template carries its own copy of the declaration rewriter: a package
 * created by `abpv create-lib` is a repository of its own and cannot reach into this
 * one. Two copies drift, so this is the gate that says they have not.
 */
describe('the library template', () => {
  it('carries the same declaration rewriter this repository uses', () => {
    const here = readFileSync(join(root, 'scripts/rewrite-vue-declarations.mjs'), 'utf8');
    const there = readFileSync(
      join(root, 'templates/lib/scripts/rewrite-vue-declarations.mjs'),
      'utf8',
    );

    expect(there).toBe(here);
  });

  it('names itself the way the renderer expects to rename it', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'templates/lib/package.json'), 'utf8')) as {
      name: string;
    };

    // `create-lib` replaces this string wherever it appears -- in the sources, in the
    // tsconfig paths and in the manifest -- so the template must use it verbatim.
    expect(manifest.name).toBe('@lsw-abpvue/template-lib');
  });
});
