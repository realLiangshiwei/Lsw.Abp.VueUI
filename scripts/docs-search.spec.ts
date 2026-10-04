import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { searchOptions } from '../docs/.vitepress/search';

const docsRequire = createRequire(new URL('../docs/package.json', import.meta.url));
const vitepressRequire = createRequire(docsRequire.resolve('vitepress/package.json'));
const MiniSearch = vitepressRequire('minisearch') as new (options: {
  fields: string[];
  tokenize?: ((text: string) => string[]) | undefined;
}) => {
  addAll(documents: { id: string; text: string }[]): void;
  search(query: string, options: { prefix: boolean }): { id: string }[];
};

describe('documentation search', () => {
  it('finds Chinese words inside an unspaced sentence', () => {
    const index = new MiniSearch({ fields: ['text'], ...searchOptions });
    index.addAll([{ id: 'modal', text: '关闭时确认丢弃未保存的更改。' }]);

    expect(index.search('未保存', { prefix: true }).map(result => result.id)).toContain('modal');
    expect(index.search('丢弃', { prefix: true }).map(result => result.id)).toContain('modal');
  });

  it('finds English words and public component names', () => {
    const index = new MiniSearch({ fields: ['text'], ...searchOptions });
    index.addAll([{ id: 'modal', text: 'AbpModal confirms unsaved changes.' }]);

    expect(index.search('unsaved', { prefix: true }).map(result => result.id)).toContain('modal');
    expect(index.search('AbpModal', { prefix: true }).map(result => result.id)).toContain('modal');
  });

  it('works when serialized for the browser', () => {
    const tokenize = runInNewContext(
      `(${searchOptions.tokenize.toString()})`,
    ) as typeof searchOptions.tokenize;

    expect(tokenize('丢弃未保存的更改')).toContain('丢弃');
    expect(tokenize('AbpModal confirms unsaved changes.')).toContain('unsaved');
  });
});
