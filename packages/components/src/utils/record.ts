import { EXTRA_PROPERTIES_KEY } from '../constants/extra-properties.js';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/** The extra properties of a record, or an empty object when it carries none. */
export function extraPropertiesOf(record: unknown): Record<string, unknown> {
  return asRecord(asRecord(record)?.[EXTRA_PROPERTIES_KEY]) ?? {};
}

/**
 * Reads a prop's value off a record, from `extraProperties` when the prop came from the
 * backend's object extensions.
 * @param record The row
 * @param name Name of the prop
 * @param isExtra Whether the value lives in `extraProperties`
 */
export function readValue(record: unknown, name: string, isExtra: boolean): unknown {
  return isExtra ? extraPropertiesOf(record)[name] : asRecord(record)?.[name];
}
