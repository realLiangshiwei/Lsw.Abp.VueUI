/** Matches a node by its value. */
export type ListPredicate<T> = (value: T) => boolean;

/** Either a value compared by reference, or a predicate run against each value. */
export type ListTarget<T> = T | ListPredicate<T>;

/**
 * Compares a value in the list with the target of a locator call. ABP's contributors
 * pass one of these to match on a single field, and so can ours:
 * `propList.addAfter(prop, 'userName', (value, name) => value.name === name)`.
 */
export type ListComparisonFn<T, U = T> = (value: T, target: U) => boolean;

/** A single link of a {@link LinkedList}. Every add call hands one back. */
export class ListNode<T> {
  previous: ListNode<T> | null = null;
  next: ListNode<T> | null = null;

  constructor(public readonly value: T) {}
}

/** Positions a value relative to the nodes already in the list. */
export interface AddLocator<T> {
  byIndex(index: number): ListNode<T> | undefined;
  before(target: ListTarget<T>): ListNode<T>;
  before<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>;
  after(target: ListTarget<T>): ListNode<T>;
  after<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>;
  head(): ListNode<T>;
  tail(): ListNode<T>;
}

/** The same positions, for a whole batch of values. */
export interface AddManyLocator<T> {
  byIndex(index: number): ListNode<T>[];
  before(target: ListTarget<T>): ListNode<T>[];
  before<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>[];
  after(target: ListTarget<T>): ListNode<T>[];
  after<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>[];
  head(): ListNode<T>[];
  tail(): ListNode<T>[];
}

/** Picks the node to remove. */
export interface DropLocator<T> {
  byIndex(index: number): ListNode<T> | undefined;
  byValue(target: ListTarget<T>): ListNode<T> | undefined;
  byValue<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T> | undefined;
  byValueAll(target: ListTarget<T>): ListNode<T>[];
  byValueAll<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>[];
  head(): ListNode<T> | undefined;
  tail(): ListNode<T> | undefined;
}

/** Picks where a run of nodes is removed from. */
export interface DropManyLocator<T> {
  byIndex(index: number): ListNode<T>[];
  head(): ListNode<T>[];
  tail(): ListNode<T>[];
}

/**
 * Doubly linked list backing the extensible table and form contributions.
 *
 * The point of a list rather than an array is that a contributor says
 * `list.add(x).after(p => p.name === 'userName')`, which keeps meaning the same thing
 * after somebody upstream inserts another column.
 *
 * A locator that matches nothing does not swallow the value: `after` appends and
 * `before` prepends, so a contributor whose target has been renamed away still sees
 * their column -- at the end of the table rather than nowhere.
 *
 * @see `LinkedList` in `@abp/utils` -- the contributor-facing semantics are the same.
 */
export class LinkedList<T> {
  #first: ListNode<T> | null = null;
  #last: ListNode<T> | null = null;
  #length = 0;

  get first(): ListNode<T> | null {
    return this.#first;
  }

  get last(): ListNode<T> | null {
    return this.#last;
  }

  get length(): number {
    return this.#length;
  }

  /** Adds a value at the front of the list. */
  addHead(value: T): ListNode<T> {
    const node = new ListNode(value);
    node.next = this.#first;

    if (this.#first) this.#first.previous = node;
    else this.#last = node;

    this.#first = node;
    this.#length++;

    return node;
  }

  /** Adds a value at the end of the list. */
  addTail(value: T): ListNode<T> {
    const node = new ListNode(value);
    node.previous = this.#last;

    if (this.#last) this.#last.next = node;
    else this.#first = node;

    this.#last = node;
    this.#length++;

    return node;
  }

  /**
   * Adds a value at the given position, shifting the node currently there to the right.
   * @param value Value to add
   * @param index Position; a negative one counts back from the end, and anything past
   * either end lands at that end
   */
  addByIndex(value: T, index: number): ListNode<T> | undefined {
    const at = this.#resolveIndex(index);
    if (at === null) return undefined;
    if (at <= 0) return this.addHead(value);
    if (at >= this.#length) return this.addTail(value);

    const next = this.#nodeAt(at);
    // Guarded by the bounds above, so `next` and its `previous` both exist.
    return next ? this.#insertBefore(value, next) : this.addTail(value);
  }

  /**
   * Adds a value in front of the first node matching the target, or at the front of the
   * list when nothing matches.
   * @param value Value to add
   * @param target Value to compare by reference, or a predicate
   */
  addBefore(value: T, target: ListTarget<T>): ListNode<T>;
  /**
   * @param value Value to add
   * @param target Passed to `compareFn` for every value in the list
   * @param compareFn Decides which node the target means
   */
  addBefore<U>(value: T, target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>;
  addBefore(value: T, target: unknown, compareFn?: ListComparisonFn<T, never>): ListNode<T> {
    const node = this.#nodeMatching(target, compareFn);
    return node ? this.#insertBefore(value, node) : this.addHead(value);
  }

  /**
   * Adds a value behind the first node matching the target, or at the end of the list
   * when nothing matches.
   * @param value Value to add
   * @param target Value to compare by reference, or a predicate
   */
  addAfter(value: T, target: ListTarget<T>): ListNode<T>;
  /**
   * @param value Value to add
   * @param target Passed to `compareFn` for every value in the list
   * @param compareFn Decides which node the target means
   */
  addAfter<U>(value: T, target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>;
  addAfter(value: T, target: unknown, compareFn?: ListComparisonFn<T, never>): ListNode<T> {
    const node = this.#nodeMatching(target, compareFn);
    return node ? this.#insertAfter(value, node) : this.addTail(value);
  }

  /** Chainable form of the add methods: `list.add(value).after(predicate)`. */
  add(value: T): AddLocator<T> {
    return {
      byIndex: index => this.addByIndex(value, index),
      before: (target: unknown, compareFn?: ListComparisonFn<T, never>) =>
        this.addBefore(value, target as T, compareFn as ListComparisonFn<T, T>),
      after: (target: unknown, compareFn?: ListComparisonFn<T, never>) =>
        this.addAfter(value, target as T, compareFn as ListComparisonFn<T, T>),
      head: () => this.addHead(value),
      tail: () => this.addTail(value),
    } as AddLocator<T>;
  }

  /** Adds values at the front, keeping their order. */
  addManyHead(values: readonly T[]): ListNode<T>[] {
    const nodes: ListNode<T>[] = [];
    for (const value of [...values].reverse()) nodes.unshift(this.addHead(value));

    return nodes;
  }

  /** Adds values at the end, keeping their order. */
  addManyTail(values: readonly T[]): ListNode<T>[] {
    return values.map(value => this.addTail(value));
  }

  /**
   * Adds values at the given position, keeping their order.
   * @param values Values to add
   * @param index Position, resolved as in {@link addByIndex}
   */
  addManyByIndex(values: readonly T[], index: number): ListNode<T>[] {
    const at = this.#resolveIndex(index);
    if (at === null) return [];
    if (at <= 0) return this.addManyHead(values);
    if (at >= this.#length) return this.addManyTail(values);

    const next = this.#nodeAt(at);
    if (!next) return this.addManyTail(values);

    return values.map(value => this.#insertBefore(value, next));
  }

  /**
   * Adds values in front of the first node matching the target, keeping their order.
   * @param values Values to add
   * @param target Value to compare by reference, or a predicate
   */
  addManyBefore(values: readonly T[], target: ListTarget<T>): ListNode<T>[];
  /**
   * @param values Values to add
   * @param target Passed to `compareFn` for every value in the list
   * @param compareFn Decides which node the target means
   */
  addManyBefore<U>(
    values: readonly T[],
    target: U,
    compareFn: ListComparisonFn<T, U>,
  ): ListNode<T>[];
  addManyBefore(
    values: readonly T[],
    target: unknown,
    compareFn?: ListComparisonFn<T, never>,
  ): ListNode<T>[] {
    const node = this.#nodeMatching(target, compareFn);
    if (!node) return this.addManyHead(values);

    return values.map(value => this.#insertBefore(value, node));
  }

  /**
   * Adds values behind the first node matching the target, keeping their order.
   * @param values Values to add
   * @param target Value to compare by reference, or a predicate
   */
  addManyAfter(values: readonly T[], target: ListTarget<T>): ListNode<T>[];
  /**
   * @param values Values to add
   * @param target Passed to `compareFn` for every value in the list
   * @param compareFn Decides which node the target means
   */
  addManyAfter<U>(
    values: readonly T[],
    target: U,
    compareFn: ListComparisonFn<T, U>,
  ): ListNode<T>[];
  addManyAfter(
    values: readonly T[],
    target: unknown,
    compareFn?: ListComparisonFn<T, never>,
  ): ListNode<T>[] {
    const node = this.#nodeMatching(target, compareFn);
    if (!node) return this.addManyTail(values);

    let previous = node;
    return values.map(value => (previous = this.#insertAfter(value, previous)));
  }

  /** Chainable form of the batch add methods: `list.addMany(values).after(predicate)`. */
  addMany(values: readonly T[]): AddManyLocator<T> {
    return {
      byIndex: index => this.addManyByIndex(values, index),
      before: (target: unknown, compareFn?: ListComparisonFn<T, never>) =>
        this.addManyBefore(values, target as T, compareFn as ListComparisonFn<T, T>),
      after: (target: unknown, compareFn?: ListComparisonFn<T, never>) =>
        this.addManyAfter(values, target as T, compareFn as ListComparisonFn<T, T>),
      head: () => this.addManyHead(values),
      tail: () => this.addManyTail(values),
    } as AddManyLocator<T>;
  }

  /** Removes the first node and returns it. */
  dropHead(): ListNode<T> | undefined {
    return this.#first ? this.#unlink(this.#first) : undefined;
  }

  /** Removes the last node and returns it. */
  dropTail(): ListNode<T> | undefined {
    return this.#last ? this.#unlink(this.#last) : undefined;
  }

  /**
   * Removes the node at the given position.
   * @param index Position; a negative one counts back from the end. Past either end
   * removes nothing
   */
  dropByIndex(index: number): ListNode<T> | undefined {
    const at = this.#resolveIndex(index);
    const node = at === null ? null : this.#nodeAt(at);

    return node ? this.#unlink(node) : undefined;
  }

  /**
   * Removes the first node matching the target.
   * @param target Value to compare by reference, or a predicate
   */
  dropByValue(target: ListTarget<T>): ListNode<T> | undefined;
  /**
   * @param target Passed to `compareFn` for every value in the list
   * @param compareFn Decides which node the target means
   */
  dropByValue<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T> | undefined;
  dropByValue(target: unknown, compareFn?: ListComparisonFn<T, never>): ListNode<T> | undefined {
    const node = this.#nodeMatching(target, compareFn);
    return node ? this.#unlink(node) : undefined;
  }

  /**
   * Removes every node matching the target.
   * @param target Value to compare by reference, or a predicate
   */
  dropByValueAll(target: ListTarget<T>): ListNode<T>[];
  /**
   * @param target Passed to `compareFn` for every value in the list
   * @param compareFn Decides which nodes the target means
   */
  dropByValueAll<U>(target: U, compareFn: ListComparisonFn<T, U>): ListNode<T>[];
  dropByValueAll(target: unknown, compareFn?: ListComparisonFn<T, never>): ListNode<T>[] {
    const matches = this.#predicateFor(target, compareFn);
    const dropped: ListNode<T>[] = [];

    for (let node = this.#first; node;) {
      const next = node.next;
      if (matches(node.value)) dropped.push(this.#unlink(node));
      node = next;
    }

    return dropped;
  }

  /**
   * Removes nodes from the front, in list order.
   * @param count How many; more than there are removes all of them
   */
  dropManyHead(count: number): ListNode<T>[] {
    return this.#dropRun(count, () => this.dropHead());
  }

  /**
   * Removes nodes from the end. They come back in list order, so the tail is last.
   * @param count How many; more than there are removes all of them
   */
  dropManyTail(count: number): ListNode<T>[] {
    return this.#dropRun(count, () => this.dropTail()).reverse();
  }

  /**
   * Removes a run of nodes starting at the given position, in list order.
   * @param count How many; a run reaching past the end stops there
   * @param index Position, resolved as in {@link dropByIndex}
   */
  dropManyByIndex(count: number, index: number): ListNode<T>[] {
    const at = this.#resolveIndex(index);
    if (at === null || at < 0 || at >= this.#length) return [];

    return this.#dropRun(count, () => this.dropByIndex(at));
  }

  /** Chainable form of the drop methods: `list.drop().byIndex(2)`. */
  drop(): DropLocator<T> {
    return {
      byIndex: index => this.dropByIndex(index),
      byValue: (target: unknown, compareFn?: ListComparisonFn<T, never>) =>
        this.dropByValue(target as T, compareFn as ListComparisonFn<T, T>),
      byValueAll: (target: unknown, compareFn?: ListComparisonFn<T, never>) =>
        this.dropByValueAll(target as T, compareFn as ListComparisonFn<T, T>),
      head: () => this.dropHead(),
      tail: () => this.dropTail(),
    } as DropLocator<T>;
  }

  /**
   * Chainable form of the batch drop methods: `list.dropMany(2).tail()`.
   * @param count How many nodes to remove
   */
  dropMany(count: number): DropManyLocator<T> {
    return {
      byIndex: index => this.dropManyByIndex(count, index),
      head: () => this.dropManyHead(count),
      tail: () => this.dropManyTail(count),
    };
  }

  /**
   * Returns the first node whose value satisfies the predicate.
   * @param predicate Test run against each value in order
   */
  find(predicate: ListPredicate<T>): ListNode<T> | null {
    for (let node = this.#first; node; node = node.next) {
      if (predicate(node.value)) return node;
    }

    return null;
  }

  /**
   * Returns the position of the first node whose value satisfies the predicate, or `-1`.
   * @param predicate Test run against each value in order
   */
  findIndex(predicate: ListPredicate<T>): number {
    let index = 0;

    for (let node = this.#first; node; node = node.next, index++) {
      if (predicate(node.value)) return index;
    }

    return -1;
  }

  /**
   * Returns the node at the given position.
   * @param index Position; a negative one counts back from the end
   */
  get(index: number): ListNode<T> | null {
    const at = this.#resolveIndex(index);
    return at === null ? null : this.#nodeAt(at);
  }

  /**
   * Returns the position of the first node matching the target, or `-1`.
   * @param target Value to compare by reference, or a predicate
   */
  indexOf(target: ListTarget<T>): number;
  /**
   * @param target Passed to `compareFn` for every value in the list
   * @param compareFn Decides which node the target means
   */
  indexOf<U>(target: U, compareFn: ListComparisonFn<T, U>): number;
  indexOf(target: unknown, compareFn?: ListComparisonFn<T, never>): number {
    return this.findIndex(this.#predicateFor(target, compareFn));
  }

  /** Copies the values into a plain array, head first. */
  toArray(): T[] {
    return [...this];
  }

  /** Copies the nodes into a plain array, head first. */
  toNodeArray(): ListNode<T>[] {
    const nodes: ListNode<T>[] = [];
    for (let node = this.#first; node; node = node.next) nodes.push(node);

    return nodes;
  }

  /**
   * Runs a callback for every value, head first.
   * @param callback Receives the value, its node and its position
   */
  forEach(callback: (value: T, node: ListNode<T>, index: number) => void): void {
    let index = 0;

    for (let node = this.#first; node; node = node.next, index++) {
      callback(node.value, node, index);
    }
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (let node = this.#first; node; node = node.next) {
      yield node.value;
    }
  }

  /** A negative index counts back from the end; a fractional one means nothing. */
  #resolveIndex(index: number): number | null {
    if (!Number.isInteger(index)) return null;

    return index < 0 ? index + this.#length : index;
  }

  #nodeAt(index: number): ListNode<T> | null {
    if (index < 0 || index >= this.#length) return null;

    let node = this.#first;
    for (let i = 0; i < index && node; i++) node = node.next;

    return node;
  }

  #predicateFor(target: unknown, compareFn?: ListComparisonFn<T, never>): ListPredicate<T> {
    if (compareFn) return value => compareFn(value, target as never);

    // A list of functions would make this ambiguous, but the extension system never
    // holds one, and ABP's own list resolves the target the same way.
    return typeof target === 'function' ? (target as ListPredicate<T>) : value => value === target;
  }

  #nodeMatching(target: unknown, compareFn?: ListComparisonFn<T, never>): ListNode<T> | null {
    return this.find(this.#predicateFor(target, compareFn));
  }

  #dropRun(count: number, drop: () => ListNode<T> | undefined): ListNode<T>[] {
    if (!Number.isInteger(count) || count <= 0) return [];

    const dropped: ListNode<T>[] = [];
    for (let i = 0; i < count; i++) {
      const node = drop();
      if (!node) break;
      dropped.push(node);
    }

    return dropped;
  }

  #insertBefore(value: T, next: ListNode<T>): ListNode<T> {
    if (!next.previous) return this.addHead(value);

    const node = new ListNode(value);
    node.previous = next.previous;
    node.next = next;
    next.previous.next = node;
    next.previous = node;
    this.#length++;

    return node;
  }

  #insertAfter(value: T, previous: ListNode<T>): ListNode<T> {
    if (!previous.next) return this.addTail(value);

    const node = new ListNode(value);
    node.previous = previous;
    node.next = previous.next;
    previous.next.previous = node;
    previous.next = node;
    this.#length++;

    return node;
  }

  #unlink(node: ListNode<T>): ListNode<T> {
    if (node.previous) node.previous.next = node.next;
    else this.#first = node.next;

    if (node.next) node.next.previous = node.previous;
    else this.#last = node.previous;

    node.previous = null;
    node.next = null;
    this.#length--;

    return node;
  }
}
