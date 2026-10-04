import { describe, expect, it } from 'vitest';
import { unifiedDiff } from './diff.js';

describe('file diff previews', () => {
  it.each(['vue\\src\\main.ts', 'vue\\nested folder\\main.ts'])(
    'uses portable separators in every diff header: %s',
    file => {
      const path = file.replaceAll('\\', '/');
      const diff = unifiedDiff(file, 'before\n', 'after\n');
      expect(diff.split('\n').slice(0, 3)).toEqual([
        `diff --git a/${path} b/${path}`,
        `--- a/${path}`,
        `+++ b/${path}`,
      ]);
    },
  );

  it('shows all lines of a new file', () => {
    expect(unifiedDiff('vue/main.ts', '', 'first\nsecond\n')).toContain(
      '@@ -0,0 +1,2 @@\n+first\n+second',
    );
  });
  it('keeps comments and unchanged context around a configuration edit', () => {
    const diff = unifiedDiff(
      'appsettings.json',
      '// keep\n{ "url": "old" }\n',
      '// keep\n{ "url": "new" }\n',
    );
    expect(diff).toContain(' // keep');
    expect(diff).toContain('-{ "url": "old" }');
    expect(diff).toContain('+{ "url": "new" }');
  });
  it('has nothing to report for an unchanged file', () => {
    expect(unifiedDiff('same', 'same\n', 'same\n')).toBe('');
  });
  it('marks each unterminated version immediately after its last line', () => {
    expect(unifiedDiff('settings', 'old', 'new')).toContain(
      '-old\n\\ No newline at end of file\n+new\n\\ No newline at end of file',
    );
  });
  it('shows a change that only adds the final newline', () => {
    expect(unifiedDiff('settings', 'same', 'same\n')).toContain(
      '-same\n\\ No newline at end of file\n+same',
    );
  });
});
