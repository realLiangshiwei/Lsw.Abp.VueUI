import { describe, expectTypeOf, it } from 'vitest';
import { LinkedList, type AddLocator, type ListNode } from './linked-list';

describe('LinkedList 的类型', () => {
  const list = new LinkedList<string>();

  it('保证插入一定拿得到节点，定位可能落空', () => {
    expectTypeOf(list.addHead('a')).toEqualTypeOf<ListNode<string>>();
    expectTypeOf(list.addTail('a')).toEqualTypeOf<ListNode<string>>();
    expectTypeOf(list.addByIndex('a', 0)).toEqualTypeOf<ListNode<string> | undefined>();
    expectTypeOf(list.addAfter('a', 'b')).toEqualTypeOf<ListNode<string> | undefined>();
  });

  it('首尾在空列表时是 null，不是 undefined', () => {
    expectTypeOf(list.first).toEqualTypeOf<ListNode<string> | null>();
    expectTypeOf(list.last).toEqualTypeOf<ListNode<string> | null>();
  });

  it('链式定位沿用元素类型', () => {
    expectTypeOf(list.add('a')).toEqualTypeOf<AddLocator<string>>();
    expectTypeOf(list.add('a').after(value => value === 'b')).toEqualTypeOf<
      ListNode<string> | undefined
    >();
  });

  it('遍历与导出都是元素类型', () => {
    expectTypeOf(list.toArray()).toEqualTypeOf<string[]>();
    expectTypeOf([...list]).toEqualTypeOf<string[]>();
    expectTypeOf(list.find).parameter(0).toEqualTypeOf<(value: string) => boolean>();
  });

  it('拒绝别的元素类型', () => {
    // @ts-expect-error 只接受 string
    list.addHead(1);
  });
});
