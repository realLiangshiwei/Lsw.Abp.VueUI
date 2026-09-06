import { beforeEach, describe, expect, it } from 'vitest';
import { LinkedList } from './linked-list.js';

interface Column {
  name: string;
}

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
      expect(list.toNodeArray()).toEqual([]);
    });

    it('a removal returns undefined', () => {
      expect(list.dropHead()).toBeUndefined();
      expect(list.dropTail()).toBeUndefined();
      expect(list.dropByIndex(0)).toBeUndefined();
      expect(list.dropByValue('a')).toBeUndefined();
      expect(list.dropByValueAll('a')).toEqual([]);
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

    it('a negative index counts back from the end', () => {
      list.addByIndex('b', -1);

      expect(list.toArray()).toEqual(['a', 'b', 'c']);
    });

    it.each([
      [3, ['a', 'c', 'b']],
      [99, ['a', 'c', 'b']],
      [-99, ['b', 'a', 'c']],
    ])('index %i past the end lands at that end', (index, expected) => {
      list.addByIndex('b', index);

      expect(list.toArray()).toEqual(expected);
    });

    it.each([1.5, NaN])('a fractional index (%s) adds nothing', index => {
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

    it('locates by a comparison function, the way a contributor migrated from ABP does', () => {
      const columns = new LinkedList<Column>();
      columns.addManyTail([{ name: 'userName' }, { name: 'email' }]);

      columns.addAfter({ name: 'phoneNumber' }, 'userName', (value, name) => value.name === name);

      expect(columns.toArray().map(column => column.name)).toEqual([
        'userName',
        'phoneNumber',
        'email',
      ]);
    });

    it('inserting before the head makes a new head', () => {
      const node = list.addBefore('x', 'a');

      expect(list.first).toBe(node);
      expect(node.previous).toBeNull();
    });

    it('inserting after the tail makes a new tail', () => {
      const node = list.addAfter('x', 'b');

      expect(list.last).toBe(node);
      expect(node.next).toBeNull();
    });

    it('a target nobody matches lands at that end instead of being dropped', () => {
      list.addBefore('x', 'missing');
      list.addAfter('y', () => false);

      expect(list.toArray()).toEqual(['x', 'a', 'b', 'y']);
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

    it('carries the comparison function through', () => {
      const columns = new LinkedList<Column>();
      columns.addManyTail([{ name: 'userName' }, { name: 'email' }]);

      columns.add({ name: 'phoneNumber' }).before('email', (value, name) => value.name === name);

      expect(columns.toArray().map(column => column.name)).toEqual([
        'userName',
        'phoneNumber',
        'email',
      ]);
    });
  });

  describe('adding many at once', () => {
    it('keeps the order of the batch wherever it lands', () => {
      fill('a', 'd');

      list.addManyByIndex(['b', 'c'], 1);

      expect(list.toArray()).toEqual(['a', 'b', 'c', 'd']);
      expect(list.length).toBe(4);
    });

    it('resolves the index of a batch the way a single value resolves it', () => {
      fill('c');

      list.addManyByIndex(['a', 'b'], -99);
      list.addManyByIndex(['d', 'e'], 99);

      expect(list.toArray()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('addManyHead and addManyTail return the nodes in the order given', () => {
      const head = list.addManyHead(['a', 'b']);
      const tail = list.addManyTail(['c', 'd']);

      expect(list.toArray()).toEqual(['a', 'b', 'c', 'd']);
      expect(head.map(node => node.value)).toEqual(['a', 'b']);
      expect(tail.map(node => node.value)).toEqual(['c', 'd']);
    });

    it('locates the batch by value, predicate or comparison function', () => {
      fill('a', 'z');

      list.addManyAfter(['b', 'c'], 'a');
      list.addManyBefore(['x', 'y'], value => value === 'z');
      list.addMany(['p', 'q']).after('c', (value, target) => value === target);

      expect(list.toArray()).toEqual(['a', 'b', 'c', 'p', 'q', 'x', 'y', 'z']);
    });

    it('a batch whose target is missing lands at that end', () => {
      fill('a');

      list.addManyAfter(['y', 'z'], 'missing');
      list.addManyBefore(['w', 'x'], 'missing');

      expect(list.toArray()).toEqual(['w', 'x', 'a', 'y', 'z']);
    });

    it('the chained locators match the direct calls', () => {
      fill('c');

      list.addMany(['a', 'b']).head();
      list.addMany(['d', 'e']).tail();
      list.addMany(['x']).byIndex(1);
      list.addMany(['y']).before('c');

      expect(list.toArray()).toEqual(['a', 'x', 'b', 'y', 'c', 'd', 'e']);
    });

    it.each([1.5, NaN])('a fractional index (%s) adds nothing', index => {
      fill('a');

      expect(list.addManyByIndex(['b'], index)).toEqual([]);
      expect(list.toArray()).toEqual(['a']);
    });

    it('an empty batch changes nothing', () => {
      fill('a');

      expect(list.addManyTail([])).toEqual([]);
      expect(list.addManyHead([])).toEqual([]);
      expect(list.toArray()).toEqual(['a']);
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

    it('a negative index counts back from the end', () => {
      expect(list.dropByIndex(-1)?.value).toBe('c');
      expect(list.toArray()).toEqual(['a', 'b']);
    });

    it.each([3, -4, 0.5])('dropByIndex(%s) out of range does nothing', index => {
      expect(list.dropByIndex(index)).toBeUndefined();
      expect(list.length).toBe(3);
    });

    it('dropByValue removes only the first match', () => {
      list.addTail('b');
      list.dropByValue('b');

      expect(list.toArray()).toEqual(['a', 'c', 'b']);
    });

    it('dropByValue takes a comparison function', () => {
      const columns = new LinkedList<Column>();
      columns.addManyTail([{ name: 'userName' }, { name: 'email' }]);

      const dropped = columns.dropByValue('email', (value, name) => value.name === name);

      expect(dropped?.value.name).toBe('email');
      expect(columns.toArray().map(column => column.name)).toEqual(['userName']);
    });

    it('dropByValueAll removes every match and leaves the rest linked', () => {
      fill('b', 'b');

      const dropped = list.dropByValueAll(value => value === 'b');

      expect(dropped.map(node => node.value)).toEqual(['b', 'b', 'b']);
      expect(list.toArray()).toEqual(['a', 'c']);
      expect(list.first?.next?.value).toBe('c');
    });

    it('dropMany removes a run from either end, in list order', () => {
      expect(list.dropManyHead(2).map(node => node.value)).toEqual(['a', 'b']);

      fill('d', 'e');

      expect(list.dropManyTail(2).map(node => node.value)).toEqual(['d', 'e']);
      expect(list.toArray()).toEqual(['c']);
    });

    it('dropMany stops when the list runs out', () => {
      expect(list.dropManyHead(99).map(node => node.value)).toEqual(['a', 'b', 'c']);
      expect(list.length).toBe(0);
    });

    it('dropManyByIndex removes a run starting where it is told', () => {
      fill('d');

      expect(list.dropManyByIndex(2, 1).map(node => node.value)).toEqual(['b', 'c']);
      expect(list.toArray()).toEqual(['a', 'd']);
    });

    it.each([0, -1, 1.5])('a count of %s removes nothing', count => {
      expect(list.dropManyHead(count)).toEqual([]);
      expect(list.dropManyTail(count)).toEqual([]);
      expect(list.dropManyByIndex(count, 0)).toEqual([]);
      expect(list.length).toBe(3);
    });

    it.each([3, -4, 0.5])('dropManyByIndex at %s removes nothing', index => {
      expect(list.dropManyByIndex(2, index)).toEqual([]);
      expect(list.length).toBe(3);
    });

    it('drop() with a chained locator matches the direct call', () => {
      list.drop().byValue('b');
      list.drop().head();
      list.drop().tail();

      expect(list.length).toBe(0);
      expect(list.first).toBeNull();
      expect(list.last).toBeNull();
    });

    it('the chained batch and comparison locators match too', () => {
      fill('b');

      expect(list.drop().byValueAll('b').length).toBe(2);
      expect(list.drop().byIndex(0)?.value).toBe('a');
      expect(
        list
          .dropMany(1)
          .byIndex(0)
          .map(node => node.value),
      ).toEqual(['c']);
      expect(list.length).toBe(0);
    });

    it('the chained batch locators reach both ends', () => {
      fill('d');

      expect(
        list
          .dropMany(2)
          .head()
          .map(node => node.value),
      ).toEqual(['a', 'b']);
      expect(
        list
          .dropMany(2)
          .tail()
          .map(node => node.value),
      ).toEqual(['c', 'd']);
      expect(list.length).toBe(0);
    });

    it('the chained locators take a comparison function as well', () => {
      const columns = new LinkedList<Column>();
      columns.addManyTail([{ name: 'userName' }, { name: 'email' }]);

      columns.drop().byValue('userName', (value, name) => value.name === name);
      columns.drop().byValueAll('email', (value, name) => value.name === name);

      expect(columns.length).toBe(0);
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

    it('findIndex returns the position, or -1', () => {
      expect(list.findIndex(value => value === 'c')).toBe(2);
      expect(list.findIndex(() => false)).toBe(-1);
    });

    it('get returns the node at a position, counting back for a negative one', () => {
      expect(list.get(1)?.value).toBe('b');
      expect(list.get(-1)?.value).toBe('c');
      expect(list.get(3)).toBeNull();
      expect(list.get(-99)).toBeNull();
      expect(list.get(1.5)).toBeNull();
    });

    it('indexOf returns -1 when there is no match', () => {
      expect(list.indexOf('c')).toBe(2);
      expect(list.indexOf('missing')).toBe(-1);
    });

    it('indexOf takes a comparison function', () => {
      const columns = new LinkedList<Column>();
      columns.addManyTail([{ name: 'userName' }, { name: 'email' }]);

      expect(columns.indexOf('email', (value, name) => value.name === name)).toBe(1);
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

    it('toNodeArray keeps the nodes, head first', () => {
      expect(list.toNodeArray().map(node => node.value)).toEqual(['a', 'b', 'c']);
    });

    it('is iterable', () => {
      expect([...list]).toEqual(['a', 'b', 'c']);
    });
  });
});
