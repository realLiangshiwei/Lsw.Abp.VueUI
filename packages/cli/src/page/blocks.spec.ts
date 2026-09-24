import { describe, expect, it } from 'vitest';
import { mergeBlocks, readBlocks } from './blocks.js';

const generated = [
  '// abpv:begin props',
  'export const COLUMNS = [1, 2, 3];',
  '// abpv:end props',
  '',
  '// abpv:begin actions',
  'export const ACTIONS = [];',
  '// abpv:end actions',
].join('\n');

describe('readBlocks', () => {
  it('reads what is inside each marker', () => {
    expect([...readBlocks(generated)]).toEqual([
      ['props', ['export const COLUMNS = [1, 2, 3];']],
      ['actions', ['export const ACTIONS = [];']],
    ]);
  });
});

describe('mergeBlocks', () => {
  it('replaces what is inside a marker and keeps everything else', () => {
    const edited = [
      "import { thing } from './mine';",
      '',
      '// abpv:begin props',
      'export const COLUMNS = [1];',
      '// abpv:end props',
      '',
      '/** My own helper, which a regeneration has no business touching. */',
      'export const helper = () => thing;',
      '',
      '// abpv:begin actions',
      'export const ACTIONS = [];',
      '// abpv:end actions',
    ].join('\n');

    const merged = mergeBlocks(edited, generated);

    expect(merged.source).toContain('export const COLUMNS = [1, 2, 3];');
    expect(merged.source).toContain('export const helper = () => thing;');
    expect(merged.source).toContain("import { thing } from './mine';");
    expect(merged.changed).toBe(true);
    expect(merged.missing).toEqual([]);
  });

  it('says so when the file has no marker for a block, rather than guessing', () => {
    const edited = ['// abpv:begin props', 'export const COLUMNS = [1];', '// abpv:end props'].join(
      '\n',
    );

    expect(mergeBlocks(edited, generated).missing).toEqual(['actions']);
  });

  it('a second run with nothing to change says nothing changed', () => {
    expect(mergeBlocks(generated, generated).changed).toBe(false);
  });
});
