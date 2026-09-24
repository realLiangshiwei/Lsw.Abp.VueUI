import type { PropertyDefinition } from '../api-definition/models.js';
import type { GenerationReport } from '../generator/report.js';

/**
 * `PropType` as the extension system spells it. The values are ABP's own, so a generated
 * page and a contributor written by hand say the same thing.
 */
export const PROP_TYPES = {
  string: 'PropType.String',
  text: 'PropType.Text',
  number: 'PropType.Number',
  boolean: 'PropType.Boolean',
  date: 'PropType.Date',
  time: 'PropType.Time',
  dateTime: 'PropType.DateTime',
  email: 'PropType.Email',
  enum: 'PropType.Enum',
} as const;

export type PropTypeExpression = (typeof PROP_TYPES)[keyof typeof PROP_TYPES];

/**
 * What the CLR types become. The keys are `type`, not `typeSimple`: ABP reports a
 * `DateTime` as a simple `string`, so a table built from `typeSimple` would show dates
 * as text and offer a text box to edit them.
 */
const BY_CLR_TYPE = new Map<string, PropTypeExpression>([
  ['System.String', PROP_TYPES.string],
  ['System.Guid', PROP_TYPES.string],
  ['System.Boolean', PROP_TYPES.boolean],
  ['System.Byte', PROP_TYPES.number],
  ['System.SByte', PROP_TYPES.number],
  ['System.Int16', PROP_TYPES.number],
  ['System.UInt16', PROP_TYPES.number],
  ['System.Int32', PROP_TYPES.number],
  ['System.UInt32', PROP_TYPES.number],
  ['System.Int64', PROP_TYPES.number],
  ['System.UInt64', PROP_TYPES.number],
  ['System.Single', PROP_TYPES.number],
  ['System.Double', PROP_TYPES.number],
  ['System.Decimal', PROP_TYPES.number],
  ['System.DateTime', PROP_TYPES.date],
  ['System.DateTimeOffset', PROP_TYPES.date],
  ['System.DateOnly', PROP_TYPES.date],
  ['System.TimeSpan', PROP_TYPES.time],
  ['System.TimeOnly', PROP_TYPES.time],
]);

/** A property name that says what the value is when the type cannot. */
const EMAIL = /email(address)?$/i;

/** `System.Int32?` is the same property type as `System.Int32`. */
export function bare(type: string): string {
  return type.replace(/\?$/, '');
}

/**
 * The `PropType` a property gets, or nothing when it is a shape a column and a form
 * control have no way to show -- a collection, a nested object, a dictionary.
 * @param property The property as the backend describes it
 * @param report Where a property left out of the page is recorded
 * @param path How the report should name the property
 */
export function propTypeOf(
  property: PropertyDefinition,
  report: GenerationReport,
  path: string,
): PropTypeExpression | undefined {
  if (property.typeSimple === 'enum') return PROP_TYPES.enum;

  const mapped = BY_CLR_TYPE.get(bare(property.type));

  if (!mapped) {
    report.add(
      'skipped',
      `${path} is a ${bare(property.type)}, which is not something a column or a form control shows; add it by hand if the page needs it.`,
    );

    return undefined;
  }

  if (mapped === PROP_TYPES.string && EMAIL.test(property.name)) return PROP_TYPES.email;

  return mapped;
}
