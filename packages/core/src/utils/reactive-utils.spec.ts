import { describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { useDebounceFn } from './use-debounce-fn.js';
import { useLatest } from './use-latest.js';
import { useSubscriptions } from './use-subscriptions.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('useLatest', () => {
  it('only the last result counts; the earlier one resolves to undefined', async () => {
    const latest = useLatest<string>();

    const first = latest.run(async () => {
      await delay(20);
      return 'first';
    });
    const second = latest.run(async () => 'second');

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBe('second');
  });

  it('the superseded call gets an aborted signal it can cancel the request with', async () => {
    const latest = useLatest<string>();
    let abandoned: AbortSignal | undefined;

    const first = latest.run(async signal => {
      abandoned = signal;
      await delay(20);
      return 'first';
    });
    await latest.run(async () => 'second');
    await first;

    expect(abandoned?.aborted).toBe(true);
  });

  it('returns as usual when nothing overlaps', async () => {
    const latest = useLatest<string>();

    await expect(latest.run(async () => 'one')).resolves.toBe('one');
    await expect(latest.run(async () => 'two')).resolves.toBe('two');
  });
});

describe('useDebounceFn', () => {
  it('repeated calls run once things go quiet, with the last arguments', async () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 5);

    debounced('a');
    debounced('b');
    await delay(20);

    expect(fn).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('stops firing once the scope is destroyed', async () => {
    const fn = vi.fn();
    const scope = effectScope();
    const debounced = scope.run(() => useDebounceFn(fn, 5));

    debounced?.('a');
    scope.stop();
    await delay(20);

    expect(fn).not.toHaveBeenCalled();
  });
});

describe('useSubscriptions', () => {
  it('unsubscribes everything when the scope ends', () => {
    const first = vi.fn();
    const second = vi.fn();
    const scope = effectScope();
    scope.run(() => useSubscriptions().add(first, second));

    scope.stop();

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('ending the scope after clear does not unsubscribe twice', () => {
    const unsubscribe = vi.fn();
    const scope = effectScope();
    const subscriptions = scope.run(() => useSubscriptions());
    subscriptions?.add(unsubscribe);

    subscriptions?.clear();
    scope.stop();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
