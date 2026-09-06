import { describe, expectTypeOf, it } from 'vitest';
import { LinkedList, type AddLocator, type ListNode } from './linked-list.js';

describe('LinkedList types', () => {
  const list = new LinkedList<string>();

  it('insertion yields a node; only an index may refuse to place one', () => {
    expectTypeOf(list.addHead('a')).toEqualTypeOf<ListNode<string>>();
    expectTypeOf(list.addTail('a')).toEqualTypeOf<ListNode<string>>();
    expectTypeOf(list.addAfter('a', 'b')).toEqualTypeOf<ListNode<string>>();
    expectTypeOf(list.addByIndex('a', 0)).toEqualTypeOf<ListNode<string> | undefined>();
  });

  it('head and tail are null on an empty list, not undefined', () => {
    expectTypeOf(list.first).toEqualTypeOf<ListNode<string> | null>();
    expectTypeOf(list.last).toEqualTypeOf<ListNode<string> | null>();
  });

  it('a chained locator keeps the element type', () => {
    expectTypeOf(list.add('a')).toEqualTypeOf<AddLocator<string>>();
    expectTypeOf(list.add('a').after(value => value === 'b')).toEqualTypeOf<ListNode<string>>();
  });

  it('a comparison function infers the target it is given', () => {
    const columns = new LinkedList<{ name: string }>();

    columns.addAfter({ name: 'phoneNumber' }, 'userName', (value, name) => {
      expectTypeOf(value).toEqualTypeOf<{ name: string }>();
      expectTypeOf(name).toEqualTypeOf<string>();
      return value.name === name;
    });

    expectTypeOf(
      columns.indexOf('userName', (value, name) => value.name === name),
    ).toEqualTypeOf<number>();
  });

  it('iteration and export are both the element type', () => {
    expectTypeOf(list.toArray()).toEqualTypeOf<string[]>();
    expectTypeOf(list.toNodeArray()).toEqualTypeOf<ListNode<string>[]>();
    expectTypeOf([...list]).toEqualTypeOf<string[]>();
    expectTypeOf(list.find).parameter(0).toEqualTypeOf<(value: string) => boolean>();
  });

  it('a node holds its value, and the value cannot be swapped out', () => {
    const node = list.addTail('a');

    expectTypeOf(node.value).toEqualTypeOf<string>();
    // @ts-expect-error the value of a node is readonly
    node.value = 'b';
  });

  it('refuses another element type', () => {
    // @ts-expect-error only a string is accepted
    list.addHead(1);
    // @ts-expect-error a batch is an array of the element type
    list.addManyTail([1]);
  });
});
