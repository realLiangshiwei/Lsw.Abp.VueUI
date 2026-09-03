import type { AbpSize } from './common.js';

export interface AbpButtonProps {
  type?: 'button' | 'submit' | 'reset' | undefined;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'link'
    | undefined;
  size?: AbpSize | undefined;
  /** Shows a spinner and refuses clicks; `disabled` without saying why. */
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  /** An icon font class, e.g. `bi bi-plus`. */
  iconClass?: string | undefined;
  block?: boolean | undefined;
  /** Required when the button renders nothing but an icon. */
  ariaLabel?: string | undefined;
}

export interface AbpButtonEmits {
  click: [event: MouseEvent];
}

export interface AbpButtonSlots {
  default?: () => unknown;
  icon?: () => unknown;
}
