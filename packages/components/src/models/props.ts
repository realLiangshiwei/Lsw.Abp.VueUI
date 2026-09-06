import type { PropType } from '../enums/prop-type.js';
import type { PropData, PropTooltip } from './prop-data.js';

/** Decides whether a prop is rendered for this row. */
export type PropPredicate<R> = (data?: PropData<R>) => boolean;

export type PropDisplayTextResolver<R> = (data?: PropData<R>) => string;

export interface PropOptions<R> {
  type: PropType;
  name: string;
  /** Localization key; the name is used when there is none. */
  displayName?: string | undefined;
  /** Policy that has to be granted for the prop to appear at all. */
  permission?: string | undefined;
  visible?: PropPredicate<R> | undefined;
  /** The value lives in `record.extraProperties[name]` rather than on the record. */
  isExtra?: boolean | undefined;
  className?: string | undefined;
  /** Localization key of the help text under a form field. */
  formText?: string | undefined;
  tooltip?: PropTooltip | undefined;
  displayTextResolver?: PropDisplayTextResolver<R> | undefined;
}

/** What a table column and a form field have in common. */
export abstract class Prop<R = unknown> {
  readonly type: PropType;
  readonly name: string;
  readonly displayName: string;
  readonly permission: string;
  readonly visible: PropPredicate<R>;
  readonly isExtra: boolean;
  readonly className: string | undefined;
  readonly formText: string | undefined;
  readonly tooltip: PropTooltip | undefined;
  readonly displayTextResolver: PropDisplayTextResolver<R> | undefined;

  protected constructor(options: PropOptions<R>) {
    this.type = options.type;
    this.name = options.name;
    this.displayName = options.displayName || options.name;
    this.permission = options.permission ?? '';
    this.visible = options.visible ?? (() => true);
    this.isExtra = options.isExtra ?? false;
    this.className = options.className;
    this.formText = options.formText;
    this.tooltip = options.tooltip;
    this.displayTextResolver = options.displayTextResolver;
  }
}

/** What a contributor is handed: the list so far, to add to, drop from or reorder. */
export type PropContributorCallback<L> = (propList: L) => void;

/** Contributors by component key, the shape a module's options take. */
export type PropContributorCallbacks<L> = Record<string, PropContributorCallback<L>[]>;

/**
 * The contributors registered for one component key. `props` runs them, in order, over a
 * fresh list -- so every render sees what the contributors say right now.
 */
export class Props<L> {
  readonly #callbacks: PropContributorCallback<L>[];
  readonly #createList: () => L;

  constructor(callbacks: PropContributorCallback<L>[], createList: () => L) {
    this.#callbacks = callbacks;
    this.#createList = createList;
  }

  get props(): L {
    const propList = this.#createList();
    for (const callback of this.#callbacks) callback(propList);

    return propList;
  }

  /** @param callback Runs after the ones already registered */
  addContributor(callback: PropContributorCallback<L>): void {
    this.#callbacks.push(callback);
  }

  /** Drops every contributor, including the module's own defaults. */
  clearContributors(): void {
    this.#callbacks.length = 0;
  }
}

/**
 * Holds the contributors of every component key of one extension point. The buckets are
 * kept here rather than in `Props`, so `get` can hand out a new `Props` over the same
 * contributors as often as it likes.
 */
export abstract class ContributorRegistry<L> {
  readonly #buckets = new Map<string, PropContributorCallback<L>[]>();

  protected bucketFor(componentKey: string): PropContributorCallback<L>[] {
    const existing = this.#buckets.get(componentKey);
    if (existing) return existing;

    const created: PropContributorCallback<L>[] = [];
    this.#buckets.set(componentKey, created);

    return created;
  }
}
