import { computed, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { unwrapResolvable } from './prop-data.js';

describe('unwrapResolvable', () => {
  it('a plain value is readable straight away', () => {
    expect(unwrapResolvable('a').value).toBe('a');
  });

  it('a ref is handed back as it is, so writing to it still works', () => {
    const source = ref('a');
    const unwrapped = unwrapResolvable(source);

    source.value = 'b';

    expect(unwrapped.value).toBe('b');
  });

  it('a getter follows what it reads', () => {
    const source = ref(1);
    const unwrapped = unwrapResolvable(() => source.value * 2);

    source.value = 21;

    expect(unwrapped.value).toBe(42);
  });

  it('a promise is undefined until it resolves', async () => {
    const unwrapped = unwrapResolvable(Promise.resolve('later'));

    expect(unwrapped.value).toBeUndefined();

    await nextTick();

    expect(unwrapped.value).toBe('later');
  });

  it('a computed counts as a ref rather than as a getter', () => {
    const source = ref('a');
    const unwrapped = unwrapResolvable(computed(() => source.value.toUpperCase()));

    source.value = 'b';

    expect(unwrapped.value).toBe('B');
  });
});
