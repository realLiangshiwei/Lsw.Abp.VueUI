import { defineService, inject, type ServiceOf } from '@lsw-abpvue/core';
import { computed, shallowRef, type ComputedRef } from 'vue';
import type { PageAlert, PageAlertInput } from '../models/page-alert.js';

/**
 * Messages that belong to the page rather than floating over it: a warning above the
 * form, not a toast that has gone by the time it is read.
 */
export const PageAlertService = defineService('PageAlertService', () => {
  const alerts = shallowRef<PageAlert[]>([]);
  let lastId = -1;

  return {
    /**
     * Adds an alert. Newest first, which is where the eye goes.
     * @param alert The alert; `id` is generated when it is left out
     * @returns The id, for removing it again
     */
    show: (alert: PageAlertInput): string => {
      lastId += 1;
      const id = alert.id ?? `abp-alert-${lastId}`;

      alerts.value = [
        { severity: 'neutral', dismissible: true, ...alert, id },
        ...alerts.value.filter(existing => existing.id !== id),
      ];

      return id;
    },

    remove: (id: string): void => {
      alerts.value = alerts.value.filter(alert => alert.id !== id);
    },

    clear: (): void => {
      alerts.value = [];
    },

    alerts: computed(() => alerts.value) as ComputedRef<PageAlert[]>,
  };
});
export type PageAlertService = ServiceOf<typeof PageAlertService>;

export const usePageAlert = (): PageAlertService => inject(PageAlertService);
