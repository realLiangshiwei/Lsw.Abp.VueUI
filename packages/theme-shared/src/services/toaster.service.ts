import {
  defineService,
  inject,
  onServiceDestroy,
  type LocalizationParam,
  type ServiceOf,
} from '@lsw-abpvue/core';
import { computed, shallowRef, type ComputedRef } from 'vue';
import type { AbpSeverity } from '../contracts/common.js';
import type { Toast, ToastId, ToastOptions } from '../models/toaster.js';

const DEFAULT_LIFE = 5000;

/**
 * The toasts that are currently up. It holds nothing but that list -- `AbpToastHost`
 * renders it -- which is what lets two themes show the same toast very differently.
 */
export const ToasterService = defineService('ToasterService', () => {
  const toasts = shallowRef<Toast[]>([]);
  const timers = new Map<ToastId, ReturnType<typeof setTimeout>>();
  let lastId = -1;

  function remove(id: ToastId): void {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }

    toasts.value = toasts.value.filter(toast => toast.id !== id);
  }

  function show(
    message: LocalizationParam,
    title?: LocalizationParam,
    severity: AbpSeverity = 'neutral',
    options: ToastOptions = {},
  ): ToastId {
    lastId += 1;
    const id = options.id ?? lastId;

    remove(id);
    toasts.value = [
      ...toasts.value,
      { id, message, title, severity, options: { closable: true, ...options, id } },
    ];

    // `life: 0` means the same as `sticky`, the way Angular's `life || 5000` reads it.
    const life = options.life ?? DEFAULT_LIFE;
    if (!options.sticky && life > 0) {
      timers.set(
        id,
        setTimeout(() => remove(id), life),
      );
    }

    return id;
  }

  // The timers outlive the toasts they are for only if the injector goes away first.
  onServiceDestroy(() => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  });

  return {
    /**
     * Shows a toast.
     * @param message Localization key, or a key with a default
     * @param title Localization key of the heading
     * @param severity Which of the five colours to use
     * @param options Lifetime, container and the rest of the per-toast settings
     * @returns The id, for removing it before its life runs out
     */
    show,

    info: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ToastOptions,
    ): ToastId => show(message, title, 'info', options),
    success: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ToastOptions,
    ): ToastId => show(message, title, 'success', options),
    warn: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ToastOptions,
    ): ToastId => show(message, title, 'warning', options),
    error: (
      message: LocalizationParam,
      title?: LocalizationParam,
      options?: ToastOptions,
    ): ToastId => show(message, title, 'error', options),

    remove,

    /**
     * Removes every toast, or every toast of one container.
     * @param containerKey Limits it to the toasts published under this key
     */
    clear: (containerKey?: string): void => {
      for (const toast of toasts.value) {
        if (containerKey === undefined || toast.options.containerKey === containerKey) {
          remove(toast.id);
        }
      }
    },

    toasts: computed(() => toasts.value) as ComputedRef<Toast[]>,
  };
});
export type ToasterService = ServiceOf<typeof ToasterService>;

export const useToaster = (): ToasterService => inject(ToasterService);
