import { describe, expect, it } from 'vitest';
import { mapEnumToOptions } from './enum-options.js';

describe('mapEnumToOptions', () => {
  it('lists a numeric enum without the reverse mapping it carries', () => {
    // A real enum, because the reverse mapping this filters out is something only the
    // enum the generator emits actually has.
    // eslint-disable-next-line no-restricted-syntax
    enum SharingStrategy {
      Isolated = 0,
      Shared = 1,
    }

    expect(mapEnumToOptions(SharingStrategy)).toEqual([
      { key: 'Isolated', value: 0 },
      { key: 'Shared', value: 1 },
    ]);
  });

  it('lists a string enum', () => {
    expect(mapEnumToOptions({ Asc: 'asc', Desc: 'desc' })).toEqual([
      { key: 'Asc', value: 'asc' },
      { key: 'Desc', value: 'desc' },
    ]);
  });
});
