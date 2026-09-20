import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// Straight at the two files, rather than through the packages: this is about what those
// two declare, and the barrels would drag a whole UI library in to say it.
import { RECOGNISED_TYPES } from '../packages/cli/src/diagnostics/object-extensions.js';
import { PropType } from '../packages/components/src/enums/prop-type.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Fifteen mapping rules turn `objectExtensions` into columns and form fields, and missing
 * any one of them looks exactly like a configuration mistake from the outside. `abpv
 * doctor` reports the difference, which only works while it knows the same rules the
 * runtime does.
 *
 * The two cannot be one module: a Node tool may not depend on a Vue package (design 03 §1).
 * So what holds them together is here, in the one place allowed to see both.
 */
describe('the object extension mapping the CLI reports on', () => {
  it('knows the property types the extension system renders', () => {
    expect([...RECOGNISED_TYPES].sort()).toEqual(Object.values(PropType).sort());
  });
});

/** The attribute names are the backend's, and both sides switch on the same strings. */
function attributesIn(file: string): string[] {
  const body = readFileSync(join(repoRoot, file), 'utf8');

  return [...body.matchAll(/case '([a-zA-Z]+)':/g)].map(match => match[1] as string).sort();
}

describe('the data annotations turned into validators', () => {
  it('are the same ones at build time and at run time', () => {
    expect(attributesIn('packages/cli/src/generator/emit-validators.ts')).toEqual(
      attributesIn('packages/components/src/utils/object-extension-validators.ts'),
    );
  });
});
