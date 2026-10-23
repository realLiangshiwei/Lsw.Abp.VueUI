import { ConfigStateService, inject, usePermission } from '@lsw-abpvue/core';
import { computed, onScopeDispose, ref, watch } from 'vue';

export function useSaasOperation(policy: string) {
  const config = inject(ConfigStateService);
  const permission = usePermission();
  const context = computed(() =>
    JSON.stringify([
      config.snapshot().currentUser.id,
      config.snapshot().currentTenant.id,
      config.snapshot().currentUser.isAuthenticated,
      config.snapshot().currentUser.impersonatorUserId,
    ]),
  );
  const allowed = computed(
    () =>
      config.snapshot().currentUser.isAuthenticated &&
      !config.snapshot().currentTenant.id &&
      permission.isGranted(policy),
  );
  const busy = ref(false);
  const failed = ref(false);
  let controller = new AbortController();
  let revision = 0;
  let disposed = false;

  function reset() {
    revision++;
    controller.abort();
    controller = new AbortController();
    busy.value = false;
    failed.value = false;
  }

  watch([context, allowed], reset, { flush: 'sync' });
  onScopeDispose(() => {
    disposed = true;
    reset();
  });

  async function run<T>(
    request: (signal: AbortSignal) => Promise<T>,
    apply: (result: T) => void = () => {},
  ): Promise<boolean> {
    if (disposed || busy.value || !allowed.value) return false;
    const own = ++revision;
    busy.value = true;
    failed.value = false;
    try {
      const result = await request(controller.signal);
      if (disposed || own !== revision || !allowed.value) return false;
      apply(result);
      return true;
    } catch {
      // The transport reports the error; the caller retains its form for an explicit retry.
      if (own === revision) failed.value = true;
      return false;
    } finally {
      if (own === revision) busy.value = false;
    }
  }

  return {
    context,
    allowed,
    busy,
    failed,
    reset,
    run,
    get signal() {
      return controller.signal;
    },
  };
}
