import { beforeEach, describe, expect, it } from 'vitest';
import { LinkedList } from './linked-list.js';

describe('LinkedList', () => {
  let list: LinkedList<string>;

  beforeEach(() => {
    list = new LinkedList<string>();
  });

  const fill = (...values: string[]) => values.forEach(value => list.addTail(value));

  describe('an empty list', () => {
    it('there is no head and no tail, and the length is zero', () => {
      expect(list.first).toBeNull();
      expect(list.last).toBeNull();
      expect(list.length).toBe(0);
      expect(list.toArray()).toEqual([]);
    });

    it('a removal returns undefined', () => {
      expect(list.dropHead()).toBeUndefined();
      expect(list.dropTail()).toBeUndefined();
      expect(list.dropByIndex(0)).toBeUndefined();
      expect(list.dropByValue('a')).toBeUndefined();
    });
  });

  describe('addHead / addTail', () => {
    it('the first element is both the head and the tail', () => {
      const node = list.addHead('a');

      expect(list.first).toBe(node);
      expect(list.last).toBe(node);
      expect(node.previous).toBeNull();
      expect(node.next).toBeNull();
    });

    it('addHead prepends, addTail appends', () => {
      list.addTail('b');
      list.addHead('a');
      list.addTail('c');

      expect(list.toArray()).toEqual(['a', 'b', 'c']);
      expect(list.length).toBe(3);
    });

    it('the links in both directions are maintained', () => {
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
    ])('inserts at index %i', (index, expected) => {
      list.addByIndex('b', index);

      expect(list.toArray()).toEqual(expected);
    });

    it.each([-1, 3, 1.5, NaN])('index %s out of range does nothing', index => {
      expect(list.addByIndex('b', index)).toBeUndefined();
      expect(list.toArray()).toEqual(['a', 'c']);
    });
  });

  describe('addBefore / addAfter', () => {
    beforeEach(() => fill('a', 'b'));

    it('locates by value', () => {
      list.addBefore('x', 'b');
      list.addAfter('y', 'b');

      expect(list.toArray()).toEqual(['a', 'x', 'b', 'y']);
    });

    it('locates by predicate', () => {
      list.addAfter('x', value => value === 'a');

      expect(list.toArray()).toEqual(['a', 'x', 'b']);
    });

    it('inserting before the head makes a new head', () => {
      const node = list.addBefore('x', 'a');

      expect(list.first).toBe(node);
      expect(node?.previous).toBeNull();
    });

    it('inserting after the tail makes a new tail', () => {
      const node = list.addAfter('x', 'b');

      expect(list.last).toBe(node);
      expect(node?.next).toBeNull();
    });

    it('does nothing when the locator finds nothing', () => {
      expect(list.addBefore('x', 'missing')).toBeUndefined();
      expect(list.addAfter('x', () => false)).toBeUndefined();
      expect(list.toArray()).toEqual(['a', 'b']);
    });
  });

  describe('add() with a chained locator', () => {
    beforeEach(() => fill('a', 'b'));

    it('after(predicate), which is what a contributor writes most often', () => {
      list.add('x').after(value => value === 'a');

      expect(list.toArray()).toEqual(['a', 'x', 'b']);
    });

    it('the other locators match the direct call', () => {
      list.add('head').head();
      list.add('tail').tail();
      list.add('byIndex').byIndex(1);
      list.add('before').before('b');

      expect(list.toArray()).toEqual(['head', 'byIndex', 'a', 'before', 'b', 'tail']);
    });
  });

  describe('removing', () => {
    beforeEach(() => fill('a', 'b', 'c'));

    it('dropHead and dropTail return the removed node, detached', () => {
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

    it('dropByIndex links the neighbours back together', () => {
      list.dropByIndex(1);

      expect(list.toArray()).toEqual(['a', 'c']);
      expect(list.first?.next?.value).toBe('c');
      expect(list.last?.previous?.value).toBe('a');
    });

    it.each([-1, 3, 0.5])('dropByIndex(%s) out of range does nothing', index => {
      expect(list.dropByIndex(index)).toBeUndefined();
      expect(list.length).toBe(3);
    });

    it('dropByValue removes only the first match', () => {
      list.addTail('b');
      list.dropByValue('b');

      expect(list.toArray()).toEqual(['a', 'c', 'b']);
    });

    it('drop() with a chained locator matches the direct call', () => {
      list.drop().byValue('b');
      list.drop().head();
      list.drop().tail();

      expect(list.length).toBe(0);
      expect(list.first).toBeNull();
      expect(list.last).toBeNull();
    });

    it('head and tail go back to null when the last one goes', () => {
      list.dropByValue('a');
      list.dropByValue('b');
      list.dropByValue('c');

      expect(list.first).toBeNull();
      expect(list.last).toBeNull();
      expect(list.length).toBe(0);
    });
  });

  describe('querying and iterating', () => {
    beforeEach(() => fill('a', 'b', 'c'));

    it('find returns the first node the predicate accepts', () => {
      expect(list.find(value => value > 'a')?.value).toBe('b');
      expect(list.find(() => false)).toBeNull();
    });

    it('indexOf returns -1 when there is no match', () => {
      expect(list.indexOf('c')).toBe(2);
      expect(list.indexOf('missing')).toBe(-1);
    });

    it('forEach yields the value, the node and the index', () => {
      const seen: [string, string, number][] = [];
      list.forEach((value, node, index) => seen.push([value, node.value, index]));

      expect(seen).toEqual([
        ['a', 'a', 0],
        ['b', 'b', 1],
        ['c', 'c', 2],
      ]);
    });

    it('is iterable', () => {
      expect([...list]).toEqual(['a', 'b', 'c']);
    });
  });
});
