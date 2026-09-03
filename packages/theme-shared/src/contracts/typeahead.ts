import type { AbpOptionValue } from './common.js';

export interface AbpTypeaheadItem {
  value: AbpOptionValue;
  label: string;
}

export interface AbpTypeaheadProps {
  modelValue?: AbpOptionValue | undefined;
  /**
   * Text for the current value before any search has run. An edit form is opened with an
   * id and a display name already in hand, and re-querying the backend to show them
   * would be a request for something the caller already has.
   */
  displayValue?: string | undefined;
  /**
   * Runs the lookup. Given to the component rather than resolved from a token because
   * every field looks something different up.
   * @param term What the user typed
   * @param signal Aborted when the term changes or the component goes away
   */
  search: (term: string, signal: AbortSignal) => Promise<readonly AbpTypeaheadItem[]>;
  /** Quiet period before a keystroke turns into a request. */
  debounce?: number | undefined;
  /** Shorter terms do not search at all. */
  minLength?: number | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
  invalid?: boolean | undefined;
  clearable?: boolean | undefined;
  id?: string | undefined;
  name?: string | undefined;
  ariaDescribedby?: string | undefined;
  ariaLabel?: string | undefined;
}

export interface AbpTypeaheadEmits {
  'update:modelValue': [value: AbpOptionValue];
  'update:displayValue': [value: string];
  /** `null` when the value was cleared. */
  select: [item: AbpTypeaheadItem | null];
}

export interface AbpTypeaheadSlots {
  item?: (context: { item: AbpTypeaheadItem; active: boolean }) => unknown;
  empty?: () => unknown;
}
