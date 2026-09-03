import { describe, expectTypeOf, it } from 'vitest';
import { LinkedList, type AddLocator, type ListNode } from './linked-list.js';

describe('LinkedList types', () => {
  const list = new LinkedList<string>();

  it('insertion always yields a node; the locator may not find one', () => {
    expectTypeOf(list.addHead('a')).toEqualTypeOf<ListNode<string>>();
    expectTypeOf(list.addTail('a')).toEqualTypeOf<ListNode<string>>();
    expectTypeOf(list.addByIndex('a', 0)).toEqualTypeOf<ListNode<string> | undefined>();
    expectTypeOf(list.addAfter('a', 'b')).toEqualTypeOf<ListNode<string> | undefined>();
  });

  it('head and tail are null on an empty list, not undefined', () => {
    expectTypeOf(list.first).toEqualTypeOf<ListNode<string> | null>();
    expectTypeOf(list.last).toEqualTypeOf<ListNode<string> | null>();
  });

  it('a chained locator keeps the element type', () => {
    expectTypeOf(list.add('a')).toEqualTypeOf<AddLocator<string>>();
    expectTypeOf(list.add('a').after(value => value === 'b')).toEqualTypeOf<
      ListNode<string> | undefined
    >();
  });

  it('iteration and export are both the element type', () => {
    expectTypeOf(list.toArray()).toEqualTypeOf<string[]>();
    expectTypeOf([...list]).toEqualTypeOf<string[]>();
    expectTypeOf(list.find).parameter(0).toEqualTypeOf<(value: string) => boolean>();
  });

  it('refuses another element type', () => {
    // @ts-expect-error only a string is accepted
    list.addHead(1);
  });
});
