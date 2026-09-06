import { LinkedList } from '@lsw-abpvue/utils';
import type { AbpOption, AbpValidator } from '@lsw-abpvue/theme-shared';
import type { Component } from 'vue';
import type { PropData, Resolvable } from './prop-data.js';
import {
  ContributorRegistry,
  Prop,
  Props,
  type PropContributorCallback,
  type PropOptions,
  type PropPredicate,
} from './props.js';

/** Fields carrying the same group name are rendered together. */
export interface FormPropGroup {
  name: string;
  className?: string | undefined;
}

export interface FormPropOptions<R> extends PropOptions<R> {
  disabled?: PropPredicate<R> | undefined;
  readonly?: PropPredicate<R> | undefined;
  /** What the field starts at when the record has no value for it. */
  defaultValue?: unknown;
  autocomplete?: string | undefined;
  /** The control's id; the name is used when there is none. */
  id?: string | undefined;
  group?: FormPropGroup | undefined;
  validators?: ((data: PropData<R>) => AbpValidator[]) | undefined;
  /**
   * The choices of a select, a multi-select or a typeahead.
   * @param data The record being edited
   * @param searchTerm What the user typed, for a typeahead
   */
  options?:
    ((data: PropData<R>, searchTerm?: string) => Resolvable<readonly AbpOption[]>) | undefined;
  /**
   * Renders the field instead of the control the type would pick. Receives the control
   * as `modelValue`, plus `prop`, `record`, `disabled` and `readonly`.
   */
  component?: Component | undefined;
}

/** One field of an extensible form. */
export class FormProp<R = unknown> extends Prop<R> {
  readonly disabled: PropPredicate<R>;
  readonly readonly: PropPredicate<R>;
  readonly defaultValue: unknown;
  readonly autocomplete: string;
  readonly id: string;
  readonly group: FormPropGroup | undefined;
  readonly validators: (data: PropData<R>) => AbpValidator[];
  readonly options:
    ((data: PropData<R>, searchTerm?: string) => Resolvable<readonly AbpOption[]>) | undefined;
  readonly component: Component | undefined;

  constructor(options: FormPropOptions<R>) {
    super(options);

    this.disabled = options.disabled ?? (() => false);
    this.readonly = options.readonly ?? (() => false);
    this.defaultValue = options.defaultValue;
    this.autocomplete = options.autocomplete ?? 'off';
    this.id = options.id ?? options.name;
    this.group = options.group;
    this.validators = options.validators ?? (() => []);
    this.options = options.options;
    this.component = options.component;
  }

  /** @param options What the field is */
  static create<R = unknown>(options: FormPropOptions<R>): FormProp<R> {
    return new FormProp<R>(options);
  }

  /** @param optionsList One entry per field, in order */
  static createMany<R = unknown>(optionsList: readonly FormPropOptions<R>[]): FormProp<R>[] {
    return optionsList.map(options => new FormProp<R>(options));
  }
}

export class FormPropList<R = unknown> extends LinkedList<FormProp<R>> {}

export type FormProps<R = unknown> = Props<FormPropList<R>>;

export type FormPropDefaults<R = unknown> = Record<string, FormProp<R>[]>;

export type FormPropContributorCallback<R = unknown> = PropContributorCallback<FormPropList<R>>;

export type FormPropContributorCallbacks<R = unknown> = Record<
  string,
  FormPropContributorCallback<R>[]
>;

/** One group of fields as the form renders it; the group is absent for a lone field. */
export interface GroupedFormProps<R = unknown> {
  group: FormPropGroup | undefined;
  props: FormProp<R>[];
}

/**
 * Collects fields into their groups, keeping the order the contributors left them in. A
 * field without a group stands on its own, so nothing is reordered by grouping.
 * @param propList The assembled fields
 */
export function groupFormProps<R>(propList: FormPropList<R>): GroupedFormProps<R>[] {
  const grouped: GroupedFormProps<R>[] = [];
  const byName = new Map<string, GroupedFormProps<R>>();

  propList.forEach(prop => {
    const name = prop.group?.name;
    if (name === undefined) {
      grouped.push({ group: undefined, props: [prop] });
      return;
    }

    const existing = byName.get(name);
    if (existing) {
      existing.props.push(prop);
      return;
    }

    const created: GroupedFormProps<R> = { group: prop.group, props: [prop] };
    byName.set(name, created);
    grouped.push(created);
  });

  return grouped;
}

/** The fields of every component key, one bucket of contributors each. */
export class FormPropsFactory extends ContributorRegistry<FormPropList<never>> {
  /**
   * @param componentKey Which component's fields, e.g. `Identity.UsersComponent`
   */
  get<R = unknown>(componentKey: string): FormProps<R> {
    // Erased for the same reason as the columns: one registry serves every component key
    // in the application, and the record type belongs to the caller.
    return new Props(
      this.bucketFor(componentKey) as unknown as FormPropContributorCallback<R>[],
      () => new FormPropList<R>(),
    );
  }
}
