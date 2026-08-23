import { beforeEach, describe, expect, it } from 'vitest';
import { LinkedList } from './linked-list';

describe('LinkedList', () => {
  let list: LinkedList<string>;

  beforeEach(() => {
    list = new LinkedList<string>();
  });

  const fill = (...values: string[]) => values.forEach(value => list.addTail(value));

  describe('空列表', () => {
    it('没有首尾节点，长度为零', () => {
      expect(list.first).toBeNull();
      expect(list.last).toBeNull();
      expect(list.length).toBe(0);
      expect(list.toArray()).toEqual([]);
    });

    it('删除操作返回 undefined', () => {
      expect(list.dropHead()).toBeUndefined();
      expect(list.dropTail()).toBeUndefined();
      expect(list.dropByIndex(0)).toBeUndefined();
      expect(list.dropByValue('a')).toBeUndefined();
    });
  });

  describe('addHead / addTail', () => {
    it('首个元素同时是首节点与尾节点', () => {
      const node = list.addHead('a');

      expect(list.first).toBe(node);
      expect(list.last).toBe(node);
      expect(node.previous).toBeNull();
      expect(node.next).toBeNull();
    });

    it('addHead 往前插，addTail 往后插', () => {
      list.addTail('b');
      list.addHead('a');
      list.addTail('c');

      expect(list.toArray()).toEqual(['a', 'b', 'c']);
      expect(list.length).toBe(3);
    });

    it('维护双向链接', () => {
      fill('a', 'b', 'c');

      expect(list.first?.next?.value).toBe('b');
      expect(list.last?.previous?.value).toBe('b');
      expect(list.first?.previous).toBeNull();
      expect(list.last?.next).toBeNull();
    });
  });

  describe('addByIndex', () => {
    beforeEach(() => fill('a', 'c'));

    it.each([
      [0, ['b', 'a', 'c']],
      [1, ['a', 'b', 'c']],
      [2, ['a', 'c', 'b']],
    ])('插到位置 %i', (index, expected) => {
      list.addByIndex('b', index);

      expect(list.toArray()).toEqual(expected);
    });

    it.each([-1, 3, 1.5, NaN])('位置 %s 越界时什么也不做', index => {
      expect(list.addByIndex('b', index)).toBeUndefined();
      expect(list.toArray()).toEqual(['a', 'c']);
    });
  });

  describe('addBefore / addAfter', () => {
    beforeEach(() => fill('a', 'b'));

    it('按值定位', () => {
      list.addBefore('x', 'b');
      list.addAfter('y', 'b');

      expect(list.toArray()).toEqual(['a', 'x', 'b', 'y']);
    });

    it('按谓词定位', () => {
      list.addAfter('x', value => value === 'a');

      expect(list.toArray()).toEqual(['a', 'x', 'b']);
    });

    it('插到首节点之前会成为新的首节点', () => {
      const node = list.addBefore('x', 'a');

      expect(list.first).toBe(node);
      expect(node?.previous).toBeNull();
    });

    it('插到尾节点之后会成为新的尾节点', () => {
      const node = list.addAfter('x', 'b');

      expect(list.last).toBe(node);
      expect(node?.next).toBeNull();
    });

    it('定位不到时什么也不做', () => {
      expect(list.addBefore('x', 'missing')).toBeUndefined();
      expect(list.addAfter('x', () => false)).toBeUndefined();
      expect(list.toArray()).toEqual(['a', 'b']);
    });
  });

  describe('add() 链式定位', () => {
    beforeEach(() => fill('a', 'b'));

    it('after(谓词) —— 贡献者最常用的写法', () => {
      list.add('x').after(value => value === 'a');

      expect(list.toArray()).toEqual(['a', 'x', 'b']);
    });

    it('其余定位方式与直接调用等价', () => {
      list.add('head').head();
      list.add('tail').tail();
      list.add('byIndex').byIndex(1);
      list.add('before').before('b');

      expect(list.toArray()).toEqual(['head', 'byIndex', 'a', 'before', 'b', 'tail']);
    });
  });

  describe('删除', () => {
    beforeEach(() => fill('a', 'b', 'c'));

    it('dropHead 与 dropTail 返回被删掉的节点并断开它', () => {
      const head = list.dropHead();

      expect(head?.value).toBe('a');
      expect(head?.next).toBeNull();
      expect(list.first?.value).toBe('b');
      expect(list.first?.previous).toBeNull();

      const tail = list.dropTail();

      expect(tail?.value).toBe('c');
      expect(list.last?.value).toBe('b');
      expect(list.last?.next).toBeNull();
    });

    it('dropByIndex 接上前后节点', () => {
      list.dropByIndex(1);

      expect(list.toArray()).toEqual(['a', 'c']);
      expect(list.first?.next?.value).toBe('c');
      expect(list.last?.previous?.value).toBe('a');
    });

    it.each([-1, 3, 0.5])('dropByIndex(%s) 越界时什么也不做', index => {
      expect(list.dropByIndex(index)).toBeUndefined();
      expect(list.length).toBe(3);
    });

    it('dropByValue 只删第一个匹配', () => {
      list.addTail('b');
      list.dropByValue('b');

      expect(list.toArray()).toEqual(['a', 'c', 'b']);
    });

    it('drop() 链式定位与直接调用等价', () => {
      list.drop().byValue('b');
      list.drop().head();
      list.drop().tail();

      expect(list.length).toBe(0);
      expect(list.first).toBeNull();
      expect(list.last).toBeNull();
    });

    it('删到空时首尾都归零', () => {
      list.dropByValue('a');
      list.dropByValue('b');
      list.dropByValue('c');

      expect(list.first).toBeNull();
      expect(list.last).toBeNull();
      expect(list.length).toBe(0);
    });
  });

  describe('查询与遍历', () => {
    beforeEach(() => fill('a', 'b', 'c'));

    it('find 返回第一个满足谓词的节点', () => {
      expect(list.find(value => value > 'a')?.value).toBe('b');
      expect(list.find(() => false)).toBeNull();
    });

    it('indexOf 找不到时返回 -1', () => {
      expect(list.indexOf('c')).toBe(2);
      expect(list.indexOf('missing')).toBe(-1);
    });

    it('forEach 依次给出值、节点与位置', () => {
      const seen: [string, string, number][] = [];
      list.forEach((value, node, index) => seen.push([value, node.value, index]));

      expect(seen).toEqual([
        ['a', 'a', 0],
        ['b', 'b', 1],
        ['c', 'c', 2],
      ]);
    });

    it('可迭代', () => {
      expect([...list]).toEqual(['a', 'b', 'c']);
    });
  });
});
