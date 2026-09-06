import { LinkedList } from '@lsw-abpvue/utils';
import type { PropData, PropTooltip } from './prop-data.js';
import { ContributorRegistry, Props, type PropContributorCallback } from './props.js';

/** Decides whether the button is shown for this row, or for this page of rows. */
export type ActionPredicate<R> = (data?: PropData<R>) => boolean;

export type ActionCallback<R> = (data: PropData<R>) => void | Promise<void>;

export interface ActionOptions<R> {
  /** Localization key of the label. */
  text: string;
  /** An icon font class, e.g. `bi bi-pencil`. */
  icon?: string | undefined;
  /** Policy that has to be granted for the button to appear. */
  permission?: string | undefined;
  visible?: ActionPredicate<R> | undefined;
  action: ActionCallback<R>;
  /** Classes handed to the theme's button, for the odd action that needs its own look. */
  btnClass?: string | undefined;
  btnStyle?: string | undefined;
  tooltip?: PropTooltip | undefined;
}

abstract class Action<R = unknown> {
  readonly text: string;
  readonly icon: string;
  readonly permission: string;
  readonly visible: ActionPredicate<R>;
  readonly action: ActionCallback<R>;
  readonly btnClass: string | undefined;
  readonly btnStyle: string | undefined;
  readonly tooltip: PropTooltip | undefined;

  protected constructor(options: ActionOptions<R>) {
    this.text = options.text;
    this.icon = options.icon ?? '';
    this.permission = options.permission ?? '';
    this.visible = options.visible ?? (() => true);
    this.action = options.action;
    this.btnClass = options.btnClass;
    this.btnStyle = options.btnStyle;
    this.tooltip = options.tooltip;
  }
}

export interface EntityActionOptions<R> extends ActionOptions<R> {
  /** Drops the label, leaving the icon. Needs an `icon`. */
  showOnlyIcon?: boolean | undefined;
}

/** One button in a row's action column. `R` is the record of that row. */
export class EntityAction<R = unknown> extends Action<R> {
  readonly showOnlyIcon: boolean;

  constructor(options: EntityActionOptions<R>) {
    super(options);
    this.showOnlyIcon = options.showOnlyIcon ?? false;
  }

  /** @param options What the button is */
  static create<R = unknown>(options: EntityActionOptions<R>): EntityAction<R> {
    return new EntityAction<R>(options);
  }

  /** @param optionsList One entry per button, in order */
  static createMany<R = unknown>(
    optionsList: readonly EntityActionOptions<R>[],
  ): EntityAction<R>[] {
    return optionsList.map(options => new EntityAction<R>(options));
  }
}

/**
 * One button above the table. `R` is the whole page of records -- write
 * `ToolbarAction.createMany<BookDto[]>`, the way ABP's own modules do -- so a bulk
 * action sees everything the user is looking at.
 */
export class ToolbarAction<R = unknown> extends Action<R> {
  constructor(options: ActionOptions<R>) {
    super(options);
  }

  /** @param options What the button is */
  static create<R = unknown>(options: ActionOptions<R>): ToolbarAction<R> {
    return new ToolbarAction<R>(options);
  }

  /** @param optionsList One entry per button, in order */
  static createMany<R = unknown>(optionsList: readonly ActionOptions<R>[]): ToolbarAction<R>[] {
    return optionsList.map(options => new ToolbarAction<R>(options));
  }
}

export class EntityActionList<R = unknown> extends LinkedList<EntityAction<R>> {}

export class ToolbarActionList<R = unknown> extends LinkedList<ToolbarAction<R>> {}

export type EntityActions<R = unknown> = Actions<EntityActionList<R>>;

export type ToolbarActions<R = unknown> = Actions<ToolbarActionList<R>>;

export type EntityActionDefaults<R = unknown> = Record<string, EntityAction<R>[]>;

export type ToolbarActionDefaults<R = unknown> = Record<string, ToolbarAction<R>[]>;

export type ActionContributorCallback<L> = PropContributorCallback<L>;

export type EntityActionContributorCallback<R = unknown> = ActionContributorCallback<
  EntityActionList<R>
>;

export type EntityActionContributorCallbacks<R = unknown> = Record<
  string,
  EntityActionContributorCallback<R>[]
>;

export type ToolbarActionContributorCallback<R = unknown> = ActionContributorCallback<
  ToolbarActionList<R>
>;

export type ToolbarActionContributorCallbacks<R = unknown> = Record<
  string,
  ToolbarActionContributorCallback<R>[]
>;

/**
 * The contributors registered for one component key. The same thing `Props` is, under
 * the name ABP's action factories use, so migrated code reads `.actions`.
 */
export class Actions<L> {
  readonly #props: Props<L>;

  constructor(callbacks: ActionContributorCallback<L>[], createList: () => L) {
    this.#props = new Props(callbacks, createList);
  }

  get actions(): L {
    return this.#props.props;
  }

  /** @param callback Runs after the ones already registered */
  addContributor(callback: ActionContributorCallback<L>): void {
    this.#props.addContributor(callback);
  }

  /** Drops every contributor, including the module's own defaults. */
  clearContributors(): void {
    this.#props.clearContributors();
  }
}

/** The row buttons of every component key, one bucket of contributors each. */
export class EntityActionsFactory extends ContributorRegistry<EntityActionList<never>> {
  /** @param componentKey Which component's row buttons */
  get<R = unknown>(componentKey: string): EntityActions<R> {
    return new Actions(
      this.bucketFor(componentKey) as unknown as EntityActionContributorCallback<R>[],
      () => new EntityActionList<R>(),
    );
  }
}

/** The toolbar buttons of every component key, one bucket of contributors each. */
export class ToolbarActionsFactory extends ContributorRegistry<ToolbarActionList<never>> {
  /** @param componentKey Which component's toolbar */
  get<R = unknown>(componentKey: string): ToolbarActions<R> {
    return new Actions(
      this.bucketFor(componentKey) as unknown as ToolbarActionContributorCallback<R>[],
      () => new ToolbarActionList<R>(),
    );
  }
}
