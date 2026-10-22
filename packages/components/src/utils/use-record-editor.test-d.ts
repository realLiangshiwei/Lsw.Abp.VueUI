import { expectTypeOf, test } from 'vitest';
import type { RecordEditor } from './use-record-editor.js';

interface Book {
  id: string;
}

test('legacy record editors may omit the optional invalidation capability', () => {
  expectTypeOf<Omit<RecordEditor<Book>, 'invalidate'>>().toExtend<RecordEditor<Book>>();
  expectTypeOf<RecordEditor<Book>['invalidate']>().toEqualTypeOf<(() => void) | undefined>();
});
