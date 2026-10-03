import { describe, expectTypeOf, it } from 'vitest';
import type { RowAction } from './index.js';

interface Book {
  id: string;
  name: string;
}

describe('application row action types', () => {
  it('passes the record directly to the action callback', () => {
    expectTypeOf<RowAction<Book>['action']>().toEqualTypeOf<(record: Book) => unknown>();
  });

  it('accepts application commands without contribution metadata', () => {
    const action: RowAction<Book> = { text: 'Edit', action: record => record.name };
    expectTypeOf(action).toMatchTypeOf<RowAction<Book>>();
  });
});
