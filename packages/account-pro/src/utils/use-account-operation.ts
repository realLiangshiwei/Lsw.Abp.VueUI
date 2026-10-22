import { AbpHttpError, ConfigStateService, inject } from '@lsw-abpvue/core';
import { onScopeDispose, ref, watch } from 'vue';

export function useAccountOperation() {
  const config = inject(ConfigStateService);
  const busy = ref(false);
  const failed = ref(false);
  const needsReload = ref(false);
  let controller = new AbortController();
  let revision = 0;
  let disposed = false;

  function invalidate(): void {
    revision += 1;
    controller.abort();
    controller = new AbortController();
    busy.value = false;
    failed.value = false;
    needsReload.value = false;
  }

  watch(
    [() => config.snapshot().currentUser.id, () => config.snapshot().currentTenant.id],
    invalidate,
    { flush: 'sync' },
  );
  onScopeDispose(() => {
    disposed = true;
    invalidate();
  });

  async function run<T>(
    request: (signal: AbortSignal) => Promise<T>,
    apply: (result: T) => void = () => {},
    write = false,
  ): Promise<boolean> {
    if (disposed || busy.value || (write && needsReload.value)) return false;
    const own = ++revision;
    busy.value = true;
    failed.value = false;
    try {
      const result = await request(controller.signal);
      if (own !== revision) return false;
      needsReload.value = false;
      apply(result);
      return true;
    } catch (error) {
      // The transport reports errors; uncertain writes need a fresh read before retrying.
      if (own === revision) {
        failed.value = true;
        needsReload.value =
          write &&
          !(error instanceof AbpHttpError && [400, 401, 403, 404, 422].includes(error.status));
      }
      return false;
    } finally {
      if (own === revision) busy.value = false;
    }
  }

  return { busy, failed, needsReload, run, invalidate };
}
