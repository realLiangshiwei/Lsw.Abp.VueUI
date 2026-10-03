import { describe, expect, it } from 'vitest';
import { mapExtensionProperty } from './index.js';

describe('shared object extension mapping', () => {
  it('uses lookup and display-text rules before interpreting the underlying CLR type', () => {
    expect(
      mapExtensionProperty('Manager', { typeSimple: 'guid', ui: { lookup: { url: '/api/users' } } })
        .type,
    ).toBe('typeahead');
    expect(mapExtensionProperty('Manager_Text', { typeSimple: 'guid' })).toMatchObject({
      type: 'hidden',
      recognised: true,
    });
  });
  it('reports unsupported types and enum definitions with the same fallback as the renderer', () => {
    expect(mapExtensionProperty('Custom', { typeSimple: 'guid' })).toMatchObject({
      type: 'string',
      recognised: false,
    });
    expect(mapExtensionProperty('Custom', { typeSimple: 'enum', type: 'Missing' })).toMatchObject({
      type: 'enum',
      recognised: false,
    });
  });
  it('maps nullable types and each surface independently', () => {
    expect(
      mapExtensionProperty('Custom', {
        typeSimple: 'number?',
        ui: {
          onTable: { isVisible: true, isSortable: true },
          onCreateForm: { isVisible: false },
          onEditForm: { isVisible: true },
        },
      }),
    ).toMatchObject({
      type: 'number',
      recognised: true,
      onTable: true,
      onCreateForm: false,
      onEditForm: true,
      sortable: true,
    });
  });
});
