import { LinkedList } from '@lsw-abpvue/utils';
import type { AbpOption } from '@lsw-abpvue/theme-shared';
import type { Component } from 'vue';
import { readValue } from '../utils/record.js';
import type { GetInjected, PropData, Resolvable } from './prop-data.js';
import {
  ContributorRegistry,
  Prop,
  Props,
  type PropContributorCallback,
  type PropOptions,
} from './props.js';

/**
 * What a cell shows. Text rather than markup: the table renders it as an interpolation,
 * so no column can inject HTML (difference 2). A column that needs more than text names
 * a `component`.
 */
export type PropValue = string | number | boolean | null | undefined;

/** Decides whether the column is in the table at all, before any row exists. */
export type ColumnPredicate = (getInjected: GetInjected) => boolean;

export interface EntityPropOptions<R> extends PropOptions<R> {
  columnWidth?: number | undefined;
  sortable?: boolean | undefined;
  columnVisible?: ColumnPredicate | undefined;
  /** For `PropType.Enum`: what the raw values mean. */
  enumList?: readonly AbpOption[] | undefined;
  /** Reads the cell's value. Defaults to the record's field of the same name. */
  valueResolver?: ((data: PropData<R>) => Resolvable<PropValue>) | undefined;
  /**
   * Renders the cell instead of the resolved value. Receives `record`, `index`, `prop`
   * and `value` as props, and can reach the row through `ROW_RECORD` as well.
   */
  component?: Component | undefined;
  /** Makes the cell itself clickable. */
  action?: ((data: PropData<R>) => void) | undefined;
}

/** One column of an extensible table. */
export class EntityProp<R = unknown> extends Prop<R> {
  readonly columnWidth: number | undefined;
  readonly sortable: boolean;
  readonly columnVisible: ColumnPredicate;
  readonly enumList: readonly AbpOption[] | undefined;
  readonly valueResolver: (data: PropData<R>) => Resolvable<PropValue>;
  readonly component: Component | undefined;
  readonly action: ((data: PropData<R>) => void) | undefined;

  constructor(options: EntityPropOptions<R>) {
    super(options);

    this.columnWidth = options.columnWidth;
    this.sortable = options.sortable ?? false;
    this.columnVisible = options.columnVisible ?? (() => true);
    this.enumList = options.enumList;
    this.component = options.component;
    this.action = options.action;
    this.valueResolver =
      options.valueResolver ??
      (data => readValue(data.record, this.name, this.isExtra) as PropValue);
  }

  /** @param options What the column is */
  static create<R = unknown>(options: EntityPropOptions<R>): EntityProp<R> {
    return new EntityProp<R>(options);
  }

  /** @param optionsList One entry per column, in order */
  static createMany<R = unknown>(optionsList: readonly EntityPropOptions<R>[]): EntityProp<R>[] {
    return optionsList.map(options => new EntityProp<R>(options));
  }
}

export class EntityPropList<R = unknown> extends LinkedList<EntityProp<R>> {}

export type EntityProps<R = unknown> = Props<EntityPropList<R>>;

export type EntityPropDefaults<R = unknown> = Record<string, EntityProp<R>[]>;

export type EntityPropContributorCallback<R = unknown> = PropContributorCallback<EntityPropList<R>>;

export type EntityPropContributorCallbacks<R = unknown> = Record<
  string,
  EntityPropContributorCallback<R>[]
>;

/** The columns of every component key, one bucket of contributors each. */
export class EntityPropsFactory extends ContributorRegistry<EntityPropList<never>> {
  /**
   * @param componentKey Which component's columns, e.g. `Identity.UsersComponent`
   */
  get<R = unknown>(componentKey: string): EntityProps<R> {
    // Buckets are stored with the record type erased -- there is one registry for every
    // component key in the application, and each key's record type is the caller's to
    // name. Everything in a bucket was registered through this same call.
    return new Props(
      this.bucketFor(componentKey) as unknown as EntityPropContributorCallback<R>[],
      () => new EntityPropList<R>(),
    );
  }
}
