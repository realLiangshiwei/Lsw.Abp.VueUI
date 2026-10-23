import { useLatest } from '@lsw-abpvue/core';
import { onBeforeUnmount, ref, shallowRef, watch, type ComputedRef } from 'vue';

export function useAuditRequest<T>(context: ComputedRef<string>) {
  const latest = useLatest<T>();
  const data = shallowRef<T>();
  const loading = ref(false);
  const failed = ref(false);
  let revision = 0;
  function reset(): void {
    revision += 1;
    latest.cancel();
    data.value = undefined;
    loading.value = false;
    failed.value = false;
  }
  async function run(read: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    const own = ++revision;
    data.value = undefined;
    failed.value = false;
    loading.value = true;
    try {
      const value = await latest.run(read);
      if (own !== revision) return;
      data.value = value;
      return value;
    } catch {
      if (own === revision) failed.value = true;
    } finally {
      if (own === revision) loading.value = false;
    }
  }
  watch(context, reset, { flush: 'sync' });
  onBeforeUnmount(reset);
  return { data, loading, failed, run, reset };
}
