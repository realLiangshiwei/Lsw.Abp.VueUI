import {
  ConfigStateService,
  inject,
  SessionStateService,
  useListService,
  useLocalization,
  usePermission,
  type PageQueryParams,
  type PagedResultDto,
  type RestConfig,
} from '@lsw-abpvue/core';
import { LANGUAGE_MANAGEMENT_FEATURES } from '@lsw-abpvue/language-management/config';
import { computed, onScopeDispose, ref, watch } from 'vue';

export function useLanguageManagement<R>(
  identifier: string,
  policy: string,
  read: (query: PageQueryParams, config: RestConfig) => Promise<PagedResultDto<R>>,
) {
  const config = inject(ConfigStateService);
  const session = inject(SessionStateService);
  const features = inject(LANGUAGE_MANAGEMENT_FEATURES);
  const permission = usePermission();
  const localization = useLocalization();
  const context = computed(() =>
    JSON.stringify([
      config.snapshot().currentUser.id,
      config.snapshot().currentUser.isAuthenticated,
      config.snapshot().currentTenant.id,
      session.getTenant()?.id,
      config.snapshot().auth.grantedPolicies,
      features.value.enable,
    ]),
  );
  const allowed = computed(
    () =>
      config.snapshot().currentUser.isAuthenticated &&
      (session.getTenant()?.id ?? null) === (config.snapshot().currentTenant.id ?? null) &&
      features.value.enable &&
      permission.isGranted(policy),
  );
  const busy = ref(false);
  const list = useListService({ persistKey: identifier });
  let lifetime = new AbortController();
  let operation = new AbortController();
  let refreshRevision = 0;
  const source = list.hookToQuery(async (query, signal) => {
    if (!allowed.value) return { items: [], totalCount: 0 };
    const own = AbortSignal.any([signal, lifetime.signal]);
    const result = await read(query, { signal: own });
    return own.aborted ? { items: [], totalCount: 0 } : result;
  });

  function cancel(): void {
    operation.abort();
    operation = new AbortController();
    busy.value = false;
  }
  watch(
    context,
    () => {
      cancel();
      lifetime.abort();
      lifetime = new AbortController();
      source.items.value = [];
      source.error.value = null;
      list.totalCount.value = 0;
      list.get();
    },
    { flush: 'sync' },
  );
  onScopeDispose(() => {
    lifetime.abort();
    operation.abort();
  });

  async function run<T>(
    request: (signal: AbortSignal) => Promise<T>,
    apply: (value: T) => void,
  ): Promise<boolean> {
    if (busy.value || !allowed.value || lifetime.signal.aborted) return false;
    const own = operation;
    busy.value = true;
    try {
      const result = await request(own.signal);
      if (own.signal.aborted) return false;
      apply(result);
      return true;
    } catch {
      // The HTTP layer reports failures; the page retains its draft for retry.
      return false;
    } finally {
      if (own === operation) busy.value = false;
    }
  }

  async function refresh(): Promise<void> {
    const own = lifetime;
    const culture = localization.currentLang.value;
    const revision = ++refreshRevision;
    try {
      const fresh = await config.readAppState({ signal: own.signal });
      if (
        !own.signal.aborted &&
        revision === refreshRevision &&
        culture === localization.currentLang.value
      )
        config.setState(fresh);
    } catch {
      // Configuration failure is reported separately from the already committed write.
    }
  }

  return {
    permission,
    localization,
    context,
    allowed,
    busy,
    list,
    ...source,
    run,
    cancel,
    refresh,
  };
}
