import { useListService, type PagedResultDto, type RestConfig } from '@lsw-abpvue/core';
import { onBeforeUnmount, shallowRef, watch, type ShallowRef } from 'vue';
import { useAuditLogging } from './use-audit-logging.js';

export function useAuditList<R, Q extends object>(
  read: (input: Q, config: RestConfig) => Promise<PagedResultDto<R>>,
  initial: Q,
  persistKey: string,
  sortKey: string,
) {
  const audit = useAuditLogging();
  const applied: ShallowRef<Q> = shallowRef(initial);
  const list = useListService({ persistKey, sortKey, sortOrder: 'desc' });
  let controller = new AbortController();
  const source = list.hookToQuery(async (query, signal) => {
    if (!audit.allowed.value) return { items: [], totalCount: 0 };
    const requestSignal = AbortSignal.any([signal, controller.signal]);
    const result = await read(
      { ...applied.value, ...query },
      {
        signal: requestSignal,
        skipHandleError: true,
      },
    );
    return requestSignal.aborted ? { items: [], totalCount: 0 } : result;
  });
  function reset(): void {
    controller.abort();
    controller = new AbortController();
    source.items.value = [];
    source.error.value = null;
    list.totalCount.value = 0;
    applied.value = initial;
  }
  watch(
    audit.context,
    () => {
      reset();
      list.get();
    },
    { flush: 'sync' },
  );
  onBeforeUnmount(reset);
  return { ...audit, ...source, applied, list };
}
