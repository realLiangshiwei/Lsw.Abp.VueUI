import { expectTypeOf, test } from 'vitest';
import type AbpExtensibleTable from './AbpExtensibleTable.vue';
interface Book {
  id: string;
  title: string;
}
type TableSlots = NonNullable<Parameters<typeof AbpExtensibleTable<Book>>[1]>['slots'];
test('custom table row actions retain the record and index types', () => {
  expectTypeOf<Parameters<NonNullable<TableSlots['actions']>>[0]>().toEqualTypeOf<{
    row: Book;
    index: number;
  }>();
});
