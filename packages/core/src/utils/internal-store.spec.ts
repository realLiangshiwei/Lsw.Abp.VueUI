import { describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import { InternalStore } from './internal-store.js';

interface State {
  name: string;
  nested: { count: number; label: string };
}

const initial: State = { name: 'root', nested: { count: 0, label: 'zero' } };
const create = () => new InternalStore<State>(structuredClone(initial));

describe('reading', () => {
  it('state is the current value', () => {
    const store = create();

    expect(store.state.value.name).toBe('root');
  });

  it('a slice follows the state', () => {
    const store = create();
    const name = store.slice(state => state.name);

    store.patch({ name: 'changed' });

    expect(name.value).toBe('changed');
  });

  it('an unrelated field changing does not recompute what reads a slice', () => {
    const store = create();
    const count = store.slice(state => state.nested.count);
    const derived = vi.fn(() => count.value * 2);
    const doubled = computed(derived);
    expect(doubled.value).toBe(0);

    store.patch({ name: 'changed' });

    expect(doubled.value).toBe(0);
    expect(derived).toHaveBeenCalledTimes(1);
  });

  it('a comparator of its own can hold back a new object of the same shape', () => {
    const store = create();
    const nested = store.slice(
      state => state.nested,
      (a, b) => a.count === b.count && a.label === b.label,
    );
    const first = nested.value;

    store.set({ ...store.state.value, nested: { count: 0, label: 'zero' } });

    expect(nested.value).toBe(first);
  });
});

describe('writing', () => {
  it('patch replaces top-level fields only', () => {
    const store = create();

    store.patch({ name: 'changed' });

    expect(store.state.value).toEqual({ name: 'changed', nested: { count: 0, label: 'zero' } });
  });

  it('deepPatch merges downwards and leaves what it does not mention', () => {
    const store = create();

    store.deepPatch({ nested: { count: 7 } });

    expect(store.state.value).toEqual({ name: 'root', nested: { count: 7, label: 'zero' } });
  });

  it('reset goes back to the initial state', () => {
    const store = create();
    store.patch({ name: 'changed' });

    store.reset();

    expect(store.state.value).toEqual(initial);
  });
});

describe('change notifications', () => {
  it('calls back only when the selected part changes', () => {
    const store = create();
    const seen = vi.fn();
    store.onUpdate(state => state.name, seen);

    store.patch({ name: 'changed' });
    store.deepPatch({ nested: { count: 1 } });

    expect(seen).toHaveBeenCalledExactlyOnceWith('changed');
  });

  it('the callback is synchronous: it lands as soon as the write is done', () => {
    const store = create();
    const order: string[] = [];
    store.onUpdate(
      state => state.name,
      () => order.push('callback'),
    );

    store.patch({ name: 'changed' });
    order.push('after set');

    expect(order).toEqual(['callback', 'after set']);
  });

  it('stops calling back once unsubscribed', () => {
    const store = create();
    const seen = vi.fn();
    const stop = store.onUpdate(state => state.name, seen);

    stop();
    store.patch({ name: 'changed' });

    expect(seen).not.toHaveBeenCalled();
  });
});
