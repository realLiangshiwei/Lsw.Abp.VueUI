/**
 * What a property is, which is what decides the control a form renders and how a table
 * cell is read. The values are ABP's `ePropType` verbatim: the backend sends them in
 * `objectExtensions` as `typeSimple`, and a contributor migrated from Angular writes
 * them as strings.
 */
export const PropType = {
  String: 'string',
  Text: 'text',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'date',
  Time: 'time',
  DateTime: 'datetime',
  Email: 'email',
  Password: 'password',
  PasswordInputGroup: 'passwordinputgroup',
  Enum: 'enum',
  MultiSelect: 'multiselect',
  Typeahead: 'typeahead',
  Hidden: 'hidden',
} as const;

export type PropType = (typeof PropType)[keyof typeof PropType];
