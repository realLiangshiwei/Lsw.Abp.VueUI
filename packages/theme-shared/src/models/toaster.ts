import type { LocalizationParam } from '@lsw-abpvue/core';
import type { AbpSeverity } from '../contracts/common.js';

export type ToastId = string | number;

export interface ToastOptions {
  /** Milliseconds before it disappears on its own. */
  life?: number | undefined;
  /** Stays until it is dismissed. */
  sticky?: boolean | undefined;
  closable?: boolean | undefined;
  tapToDismiss?: boolean | undefined;
  messageLocalizationParams?: string[] | undefined;
  titleLocalizationParams?: string[] | undefined;
  /** Given one, the caller owns the id and can show the same toast again. */
  id?: ToastId | undefined;
  /** Routes the toast to the matching `AbpToastHost`, e.g. one inside a dialog. */
  containerKey?: string | undefined;
  iconClass?: string | undefined;
}

export interface Toast {
  id: ToastId;
  message: LocalizationParam;
  title: LocalizationParam | undefined;
  severity: AbpSeverity;
  options: ToastOptions;
}
