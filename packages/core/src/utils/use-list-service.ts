import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { PageQueryParams, PagedResultDto, RequestStatus, SortOrder } from '../models/list.js';
import { useListPreferences } from './list-preferences.js';
import { useDebounceFn } from './use-debounce-fn.js';
import { useLatest } from './use-latest.js';

export interface ListServiceOptions {
  /** Quiet period before a changed filter is sent. */
  debounceMs?: number | undefined;
  maxResultCount?: number | undefined;
  sortKey?: string | undefined;
  sortOrder?: SortOrder | undefined;
  /**
   * Remembers the page size and the sorting under this name, per user. The extensible
   * table stores which columns are hidden under the same one (difference +).
   */
  persistKey?: string | undefined;
}

export interface ListSource<R> {
  items: Ref<R[]>;
  totalCount: Ref<number>;
  error: Ref<unknown>;
}

export interface ListService {
  /** What the preferences of this list are stored under, if it stores any. */
  readonly persistKey: string | undefined;
  filter: Ref<string>;
  /** Zero-based, the way `skipCount` is computed from it. */
  page: Ref<number>;
  maxResultCount: Ref<number>;
  sortKey: Ref<string>;
  sortOrder: Ref<SortOrder>;
  readonly totalCount: Ref<number>;
  readonly requestStatus: ComputedRef<RequestStatus>;
  readonly query: ComputedRef<PageQueryParams>;
  /**
   * Binds a data source to the query. Re-runs whenever the query changes, and only the
   * newest answer is kept.
   * @param fetcher Receives the query and a signal it may pass to the backend call
   */
  hookToQuery<R>(
    fetcher: (query: PageQueryParams, signal: AbortSignal) => Promise<PagedResultDto<R>>,
  ): ListSource<R>;
  /** Back to the first page and reload — what a toolbar's refresh button does. */
  get(): void;
  getWithoutPageReset(): void;
}

/**
 * The state behind a paged, sorted, filtered table. A composable rather than a
 * component-level injectable: it belongs to the component that renders the list, and its
 * watchers stop with it (difference 8).
 */
export function useListService(options: ListServiceOptions = {}): ListService {
  const preferences = options.persistKey ? useListPreferences(options.persistKey) : undefined;
  const stored = preferences?.read() ?? {};

  const filter = ref('');
  const page = ref(0);
  const maxResultCount = ref(stored.maxResultCount ?? options.maxResultCount ?? 10);
  const sortKey = ref(stored.sortKey ?? options.sortKey ?? '');
  const sortOrder = ref<SortOrder>(stored.sortOrder ?? options.sortOrder ?? '');
  const totalCount = ref(0);
  const status = ref<RequestStatus>('idle');
  // Bumped to ask for the same query again, which is what a refresh button needs.
  const reloads = ref(0);

  const query = computed<PageQueryParams>(() => ({
    filter: filter.value || undefined,
    sorting: sortKey.value ? `${sortKey.value} ${sortOrder.value}`.trim() : undefined,
    skipCount: page.value * maxResultCount.value,
    maxResultCount: maxResultCount.value,
  }));

  // Typing into a filter box should not walk the user back through pages of results.
  watch(filter, () => {
    page.value = 0;
  });

  // Only what the user changed after the list was built: the defaults are not a
  // preference, and storing them would freeze a module's own default sorting.
  if (preferences) {
    watch([maxResultCount, sortKey, sortOrder], ([count, key, order]) => {
      preferences.patch({ maxResultCount: count, sortKey: key, sortOrder: order });
    });
  }

  return {
    persistKey: options.persistKey,
    filter,
    page,
    maxResultCount,
    sortKey,
    sortOrder,
    totalCount,
    requestStatus: computed(() => status.value),
    query,

    hookToQuery<R>(
      fetcher: (query: PageQueryParams, signal: AbortSignal) => Promise<PagedResultDto<R>>,
    ): ListSource<R> {
      const items = ref<R[]>([]) as Ref<R[]>;
      const error = ref<unknown>(null);
      const latest = useLatest<PagedResultDto<R>>();

      const run = async (): Promise<void> => {
        status.value = 'loading';

        try {
          const result = await latest.run(signal => fetcher(query.value, signal));
          // `undefined` means a newer request took over; its answer is the one that counts.
          if (!result) return;

          items.value = result.items;
          totalCount.value = result.totalCount;
          error.value = null;
          status.value = 'success';
        } catch (cause) {
          error.value = cause;
          status.value = 'error';
        }
      };

      const runDebounced = useDebounceFn(run, options.debounceMs ?? 300);
      let lastFilter = filter.value;

      watch([query, reloads], () => {
        if (filter.value === lastFilter) {
          void run();
          return;
        }

        lastFilter = filter.value;
        runDebounced();
      });

      void run();

      return { items, totalCount, error };
    },

    get: () => {
      page.value = 0;
      reloads.value += 1;
    },

    getWithoutPageReset: () => {
      reloads.value += 1;
    },
  };
}
