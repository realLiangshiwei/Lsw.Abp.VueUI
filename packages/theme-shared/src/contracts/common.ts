/**
 * What a select, a radio group or a typeahead can carry as a value. ABP sends enum
 * members, lookup ids and flags as primitives, so nothing here needs a type parameter --
 * and a contract without one is a contract every theme can implement with a plain
 * component.
 */
export type AbpOptionValue = string | number | boolean | null;

export interface AbpOption {
  value: AbpOptionValue;
  /** Already localized: the caller knows the resource, the theme does not. */
  label: string;
  disabled?: boolean | undefined;
  /** Renders as an option group when the theme supports one. */
  group?: string | undefined;
}

export type AbpSize = 'sm' | 'md' | 'lg';

/** The five severities ABP colours toasts, confirmations and alerts by. */
export type AbpSeverity = 'neutral' | 'success' | 'info' | 'warning' | 'error';
