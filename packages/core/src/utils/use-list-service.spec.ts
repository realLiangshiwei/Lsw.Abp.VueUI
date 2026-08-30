import { describe, expect, it, vi } from 'vitest';
import type { PageQueryParams, PagedResultDto } from '../models/list';
import { useListService } from './use-list-service';

const page = <R>(items: R[], totalCount = items.length): PagedResultDto<R> => ({
  items,
  totalCount,
});
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
/** Lets the watchers run and the fetch promise settle. */
const settled = () => delay(0);

function listOf(...responses: PagedResultDto<string>[]) {
  const queries: PageQueryParams[] = [];
  let call = 0;
  const fetcher = vi.fn(async (query: PageQueryParams) => {
    queries.push(query);
    return responses[Math.min(call++, responses.length - 1)] ?? page<string>([]);
  });

  const list = useListService({ debounceMs: 5 });
  const source = list.hookToQuery(fetcher);

  return { list, source, fetcher, queries };
}

describe('query parameters', () => {
  it('the first page has a skipCount of 0 and carries the page size', async () => {
    const { queries } = listOf(page(['a']));
    await settled();

    expect(queries[0]).toEqual({
      filter: undefined,
      sorting: undefined,
      skipCount: 0,
      maxResultCount: 10,
    });
  });

  it('a page becomes a skipCount', async () => {
    const { list, queries } = listOf(page(['a']));
    await settled();

    list.page.value = 2;
    await settled();

    expect(queries.at(-1)?.skipCount).toBe(20);
  });

  it('sorting becomes the string the backend wants', async () => {
    const { list, queries } = listOf(page(['a']));
    await settled();

    list.sortKey.value = 'name';
    list.sortOrder.value = 'desc';
    await settled();

    expect(queries.at(-1)?.sorting).toBe('name desc');
  });
});

describe('fetching', () => {
  it('fetches once when mounted, into items and totalCount', async () => {
    const { source } = listOf(page(['a', 'b'], 42));
    await settled();

    expect(source.items.value).toEqual(['a', 'b']);
    expect(source.totalCount.value).toBe(42);
  });

  it('the status goes from loading to success', async () => {
    const { list } = listOf(page(['a']));
    expect(list.requestStatus.value).toBe('loading');

    await settled();

    expect(list.requestStatus.value).toBe('success');
  });

  it('a failure is recorded and the status becomes error', async () => {
    const list = useListService();
    const source = list.hookToQuery(() => Promise.reject(new Error('boom')));
    await settled();

    expect(list.requestStatus.value).toBe('error');
    expect(source.error.value).toBeInstanceOf(Error);
  });

  it('get returns to the first page and fetches again', async () => {
    const { list, fetcher } = listOf(page(['a']));
    await settled();
    list.page.value = 3;
    await settled();

    list.get();
    await settled();

    expect(list.page.value).toBe(0);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('getWithoutPageReset stays on the page and fetches again', async () => {
    const { list, queries } = listOf(page(['a']));
    await settled();
    list.page.value = 3;
    await settled();

    list.getWithoutPageReset();
    await settled();

    expect(list.page.value).toBe(3);
    expect(queries.at(-1)?.skipCount).toBe(30);
  });
});

describe('filtering', () => {
  it('repeated typing sends one request, with the last keyword', async () => {
    const { list, fetcher, queries } = listOf(page(['a']));
    await settled();
    const before = fetcher.mock.calls.length;

    list.filter.value = 'a';
    await settled();
    list.filter.value = 'ab';
    await settled();
    await delay(20);

    expect(fetcher.mock.calls.length).toBe(before + 1);
    expect(queries.at(-1)?.filter).toBe('ab');
  });

  it('changing the keyword goes back to the first page', async () => {
    const { list, queries } = listOf(page(['a']));
    await settled();
    list.page.value = 4;
    await settled();

    list.filter.value = 'abp';
    await settled();
    await delay(20);

    expect(list.page.value).toBe(0);
    expect(queries.at(-1)?.skipCount).toBe(0);
  });
});

describe('races', () => {
  it('a slow answer arriving late does not overwrite a newer result', async () => {
    let call = 0;
    const list = useListService();
    const source = list.hookToQuery(async () => {
      call += 1;
      if (call === 1) {
        await delay(20);
        return page(['stale']);
      }
      return page(['fresh']);
    });
    await settled();

    list.getWithoutPageReset();
    await settled();
    await delay(40);

    expect(source.items.value).toEqual(['fresh']);
    expect(list.requestStatus.value).toBe('success');
  });

  it('whoever fetches gets the signal and can cancel the request', async () => {
    const signals: AbortSignal[] = [];
    const list = useListService();
    list.hookToQuery(async (_query, signal) => {
      signals.push(signal);
      await delay(20);
      return page(['x']);
    });
    await settled();

    list.getWithoutPageReset();
    await settled();
    await delay(40);

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });
});
