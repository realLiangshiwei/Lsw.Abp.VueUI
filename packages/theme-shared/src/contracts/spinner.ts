import type { AbpSize } from './common.js';

export interface AbpSpinnerProps {
  size?: AbpSize | undefined;
  /** Accessible name; a theme falls back to the localized "loading" text. */
  label?: string | undefined;
  /** Covers the nearest positioned ancestor instead of sitting in the flow. */
  overlay?: boolean | undefined;
}
