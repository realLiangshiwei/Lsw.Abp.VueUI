import { useEventBus, useSubscriptions } from '@lsw-abpvue/core';
import { SaasEvents } from '@lsw-abpvue/saas/config';
import type { SaasEventContext } from '@lsw-abpvue/saas/config';
import { onScopeDispose, watch } from 'vue';
import type { useSaasOperation } from './use-saas-operation.js';

export function useSaasWidgetRefresh(
  operation: ReturnType<typeof useSaasOperation>,
  load: () => Promise<void>,
  clear: () => void,
): () => Promise<void> {
  const bus = useEventBus();
  const subscriptions = useSubscriptions();
  let revision = 0;
  let dirty = false;
  let disposed = false;
  let pending: Promise<void> | undefined;

  async function drain(own: number): Promise<void> {
    try {
      while (dirty && !disposed && own === revision && operation.allowed.value) {
        dirty = false;
        await load();
      }
    } finally {
      if (own === revision) pending = undefined;
    }
  }

  function draw(): Promise<void> {
    if (disposed || !operation.allowed.value) return Promise.resolve();
    dirty = true;
    return (pending ??= drain(revision));
  }

  function changed(event: { context: SaasEventContext }): Promise<void> | undefined {
    const current = operation.eventContext.value;
    if (event.context.userId === current.userId && event.context.tenantId === current.tenantId)
      return draw();
  }

  subscriptions.add(
    bus.on(SaasEvents.TenantsChanged, changed),
    bus.on(SaasEvents.EditionsChanged, changed),
  );
  watch(
    [operation.context, operation.allowed],
    () => {
      revision += 1;
      dirty = false;
      pending = undefined;
      clear();
      void draw();
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(() => {
    disposed = true;
    revision += 1;
    dirty = false;
    pending = undefined;
  });
  return draw;
}
