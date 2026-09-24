import { describe, expect, it } from 'vitest';
import type { PropertyDefinition } from '../api-definition/models.js';
import { GenerationReport } from '../generator/report.js';
import { propTypeOf } from './prop-type.js';

function property(partial: Partial<PropertyDefinition>): PropertyDefinition {
  return {
    name: 'value',
    type: 'System.String',
    typeSimple: 'string',
    isRequired: false,
    isNullable: false,
    ...partial,
  };
}

function typeOf(partial: Partial<PropertyDefinition>): string | undefined {
  return propTypeOf(property(partial), new GenerationReport(), 'Book.Value');
}

describe('propTypeOf', () => {
  it('reads the CLR type, not the simple one', () => {
    // ABP reports a DateTime as a simple `string`, so a table built from `typeSimple`
    // would show dates as text and offer a text box to edit them.
    expect(typeOf({ type: 'System.DateTime', typeSimple: 'string' })).toBe('PropType.Date');
    expect(typeOf({ type: 'System.Guid', typeSimple: 'string' })).toBe('PropType.String');
  });

  it('a nullable value is the same control as a required one', () => {
    expect(typeOf({ type: 'System.Int32?', typeSimple: 'number?' })).toBe('PropType.Number');
    expect(typeOf({ type: 'System.DateTime?', typeSimple: 'string?' })).toBe('PropType.Date');
  });

  it('every numeric the CLR has is one number control', () => {
    for (const type of ['System.Int16', 'System.Int64', 'System.Double', 'System.Decimal']) {
      expect(typeOf({ type })).toBe('PropType.Number');
    }
  });

  it('an enum is an enum whatever its type is called', () => {
    expect(typeOf({ type: 'Acme.BookStore.BookType', typeSimple: 'enum' })).toBe('PropType.Enum');
  });

  it('a property named after an address gets the email control', () => {
    expect(typeOf({ name: 'EmailAddress' })).toBe('PropType.Email');
    expect(typeOf({ name: 'Email' })).toBe('PropType.Email');
    expect(typeOf({ name: 'EmailConfirmed', type: 'System.Boolean' })).toBe('PropType.Boolean');
  });

  it('says which properties it left out and why', () => {
    const report = new GenerationReport();
    const collection = property({ name: 'Tags', type: '[System.String]', typeSimple: '[string]' });

    expect(propTypeOf(collection, report, 'Book.Tags')).toBeUndefined();
    expect(report.of('skipped')[0]).toMatch(/Book.Tags is a \[System.String\]/);
  });
});
