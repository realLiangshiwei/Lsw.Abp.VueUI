import {
  defineService,
  inject,
  onServiceDestroy,
  type LocalizationParam,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, shallowRef, type ComputedRef } from 'vue';
import type { AbpSeverity } from '../contracts/common.js';
import {
  ConfirmationStatus,
  type ConfirmationOptions,
  type ConfirmationRequest,
} from '../models/confirmation.js';

/**
 * The one confirmation that can be open at a time. `show` resolves once the user has
 * answered, so a caller reads like the question it is asking:
 * `if (await confirmation.warn(...) !== ConfirmationStatus.confirm) return;`
 */
export const ConfirmationService = defineService('ConfirmationService', () => {
  const current = shallowRef<ConfirmationRequest | null>(null);
  let lastId = -1;
  let settle: ((status: ConfirmationStatus) => void) | null = null;

  function clear(status: ConfirmationStatus = ConfirmationStatus.dismiss): void {
    current.value = null;

    const resolve = settle;
    settle = null;
    resolve?.(status);
  }

  function show(
    message: LocalizationParam,
    title?: LocalizationParam,
    severity: AbpSeverity = 'neutral',
    options: ConfirmationOptions = {},
  ): Promise<ConfirmationStatus> {
    // Asking a second question dismisses the first rather than leaving its caller
    // waiting on a promise nothing can settle any more.
    clear();

    lastId += 1;
    current.value = {
      id: lastId,
      message,
      title,
      severity,
      options: { dismissible: true, ...options },
    };

    return new Promise<ConfirmationStatus>(resolve => {
      settle = resolve;
    });
  }

  // An injector torn down with a question open would otherwise strand its caller.
  onServiceDestroy(() => clear());

  return {
    /**
     * Asks a question.
     * @param message Localization key of the question
     * @param title Localization key of the heading
     * @param severity Which of the five colours to use
     * @param options Button texts, whether Esc dismisses it, and the rest
     * @returns How the user answered
     */
    show,

    info: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ConfirmationOptions,
    ): Promise<ConfirmationStatus> => show(message, title, 'info', options),
    success: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ConfirmationOptions,
    ): Promise<ConfirmationStatus> => show(message, title, 'success', options),
    warn: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ConfirmationOptions,
    ): Promise<ConfirmationStatus> => show(message, title, 'warning', options),
    error: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ConfirmationOptions,
    ): Promise<ConfirmationStatus> => show(message, title, 'error', options),

    /**
     * Closes the open confirmation with an answer. This is how `AbpConfirmHost` reports
     * what the user picked, and how a caller cancels a question it no longer needs.
     * @param status Defaults to `dismiss`
     */
    clear,

    current: computed(() => current.value) as ComputedRef<ConfirmationRequest | null>,
  };
});
export type ConfirmationService = ServiceOf<typeof ConfirmationService>;

export const useConfirmation = (): ConfirmationService => inject(ConfirmationService);
