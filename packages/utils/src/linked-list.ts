/** Matches a node by its value. */
export type ListPredicate<T> = (value: T) => boolean;

/** Either a value compared by reference, or a predicate run against each value. */
export type ListTarget<T> = T | ListPredicate<T>;

/** A single link of a {@link LinkedList}. Every add call hands one back. */
export class ListNode<T> {
  previous: ListNode<T> | null = null;
  next: ListNode<T> | null = null;

  constructor(public value: T) {}
}

/** Positions a value relative to the nodes already in the list. */
export interface AddLocator<T> {
  byIndex(index: number): ListNode<T> | undefined;
  before(target: ListTarget<T>): ListNode<T> | undefined;
  after(target: ListTarget<T>): ListNode<T> | undefined;
  head(): ListNode<T>;
  tail(): ListNode<T>;
}

/** Picks the node to remove. */
export interface DropLocator<T> {
  byIndex(index: number): ListNode<T> | undefined;
  byValue(value: T): ListNode<T> | undefined;
  head(): ListNode<T> | undefined;
  tail(): ListNode<T> | undefined;
}

/**
 * Doubly linked list backing the extensible table and form contributions.
 *
 * The point of a list rather than an array is that a contributor says
 * `list.add(x).after(p => p.name === 'userName')`, which keeps meaning the same thing
 * after somebody upstream inserts another column.
 *
 * @see `LinkedList` in `@abp/utils` — the contributor-facing semantics are the same.
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
   * @param index Position between `0` and `length`; anything else adds nothing
   */
  addByIndex(value: T, index: number): ListNode<T> | undefined {
    if (!Number.isInteger(index) || index < 0 || index > this.#length) return undefined;
    if (index === 0) return this.addHead(value);
    if (index === this.#length) return this.addTail(value);

    const next = this.#nodeAt(index);
    // Guarded by the bounds check above, so `next` and its `previous` both exist.
    return next ? this.#insertBefore(value, next) : undefined;
  }

  /**
   * Adds a value in front of the first node matching the target.
   * @param value Value to add
   * @param target Value to compare by reference, or a predicate
   */
  addBefore(value: T, target: ListTarget<T>): ListNode<T> | undefined {
    const node = this.#nodeMatching(target);
    return node ? this.#insertBefore(value, node) : undefined;
  }

  /**
   * Adds a value behind the first node matching the target.
   * @param value Value to add
   * @param target Value to compare by reference, or a predicate
   */
  addAfter(value: T, target: ListTarget<T>): ListNode<T> | undefined {
    const node = this.#nodeMatching(target);
    return node ? this.#insertAfter(value, node) : undefined;
  }

  /** Chainable form of the add methods: `list.add(value).after(predicate)`. */
  add(value: T): AddLocator<T> {
    return {
      byIndex: index => this.addByIndex(value, index),
      before: target => this.addBefore(value, target),
      after: target => this.addAfter(value, target),
      head: () => this.addHead(value),
      tail: () => this.addTail(value),
    };
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
   * @param index Position between `0` and `length - 1`; anything else removes nothing
   */
  dropByIndex(index: number): ListNode<T> | undefined {
    const node = this.#nodeAt(index);
    return node ? this.#unlink(node) : undefined;
  }

  /**
   * Removes the first node holding the given value, compared by reference.
   * @param value Value to look for
   */
  dropByValue(value: T): ListNode<T> | undefined {
    const node = this.find(candidate => candidate === value);
    return node ? this.#unlink(node) : undefined;
  }

  /** Chainable form of the drop methods: `list.drop().byIndex(2)`. */
  drop(): DropLocator<T> {
    return {
      byIndex: index => this.dropByIndex(index),
      byValue: value => this.dropByValue(value),
      head: () => this.dropHead(),
      tail: () => this.dropTail(),
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
   * Returns the position of the first node holding the value, or `-1`.
   * @param value Value compared by reference
   */
  indexOf(value: T): number {
    let index = 0;

    for (let node = this.#first; node; node = node.next, index++) {
      if (node.value === value) return index;
    }

    return -1;
  }

  /** Copies the values into a plain array, head first. */
  toArray(): T[] {
    return [...this];
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

  #nodeAt(index: number): ListNode<T> | null {
    if (!Number.isInteger(index) || index < 0 || index >= this.#length) return null;

    let node = this.#first;
    for (let i = 0; i < index && node; i++) node = node.next;

    return node;
  }

  #nodeMatching(target: ListTarget<T>): ListNode<T> | null {
    // A list of functions would make this ambiguous, but the extension system never
    // holds one, and ABP's own list resolves the target the same way.
    const predicate: ListPredicate<T> =
      typeof target === 'function' ? (target as ListPredicate<T>) : value => value === target;

    return this.find(predicate);
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
