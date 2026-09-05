import type { LocalizationParam } from '@lsw-abpvue/core';
import type { AbpSeverity } from '../contracts/common.js';

/**
 * How a confirmation ended. `dismiss` is the escape hatch -- Esc, the backdrop, the
 * close button -- and is what an unanswered confirmation resolves to.
 */
export const ConfirmationStatus = {
  confirm: 'confirm',
  reject: 'reject',
  dismiss: 'dismiss',
} as const;
export type ConfirmationStatus = (typeof ConfirmationStatus)[keyof typeof ConfirmationStatus];

export interface ConfirmationOptions {
  /** Esc and the backdrop close it. */
  dismissible?: boolean | undefined;
  messageLocalizationParams?: string[] | undefined;
  titleLocalizationParams?: string[] | undefined;
  hideCancelBtn?: boolean | undefined;
  hideYesBtn?: boolean | undefined;
  cancelText?: LocalizationParam | undefined;
  yesText?: LocalizationParam | undefined;
  iconClass?: string | undefined;
}

export interface ConfirmationRequest {
  id: number;
  message: LocalizationParam;
  title: LocalizationParam | undefined;
  severity: AbpSeverity;
  options: ConfirmationOptions;
}
