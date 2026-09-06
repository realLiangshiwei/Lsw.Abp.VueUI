import { describe, expect, it } from 'vitest';
import { PropType } from '../enums/prop-type.js';
import { EntityAction, ToolbarAction } from './actions.js';
import { EntityProp } from './entity-props.js';
import { FormProp, FormPropList, groupFormProps } from './form-props.js';
import type { PropData } from './prop-data.js';

interface Book {
  id: string;
  name: string;
  extraProperties?: Record<string, unknown>;
}

const dataFor = (record: Book): PropData<Book> => ({
  record,
  index: 0,
  getInjected: (() => undefined) as unknown as PropData<Book>['getInjected'],
});

describe('EntityProp', () => {
  it('falls back to the name where a display name is expected', () => {
    const prop = EntityProp.create<Book>({ type: PropType.String, name: 'name' });

    expect(prop.displayName).toBe('name');
    expect(prop.sortable).toBe(false);
    expect(prop.permission).toBe('');
    expect(prop.visible()).toBe(true);
    expect(prop.columnVisible(undefined as never)).toBe(true);
  });

  it('reads the record field of the same name by default', () => {
    const prop = EntityProp.create<Book>({ type: PropType.String, name: 'name' });

    expect(prop.valueResolver(dataFor({ id: '1', name: 'Dune' }))).toBe('Dune');
  });

  it('reads an extra property when the prop came from the backend', () => {
    const prop = EntityProp.create<Book>({
      type: PropType.String,
      name: 'Isbn',
      isExtra: true,
    });

    const value = prop.valueResolver(
      dataFor({ id: '1', name: 'Dune', extraProperties: { Isbn: '0441013597' } }),
    );

    expect(value).toBe('0441013597');
  });

  it('a record without extra properties resolves to undefined rather than throwing', () => {
    const prop = EntityProp.create<Book>({ type: PropType.String, name: 'Isbn', isExtra: true });

    expect(prop.valueResolver(dataFor({ id: '1', name: 'Dune' }))).toBeUndefined();
  });

  it('createMany keeps the order it was given', () => {
    const props = EntityProp.createMany<Book>([
      { type: PropType.String, name: 'name' },
      { type: PropType.String, name: 'id' },
    ]);

    expect(props.map(prop => prop.name)).toEqual(['name', 'id']);
  });
});

describe('FormProp', () => {
  it('an id defaults to the name, and nothing is disabled or read-only', () => {
    const prop = FormProp.create<Book>({ type: PropType.String, name: 'name' });

    expect(prop.id).toBe('name');
    expect(prop.autocomplete).toBe('off');
    expect(prop.disabled()).toBe(false);
    expect(prop.readonly()).toBe(false);
    expect(prop.validators(dataFor({ id: '1', name: 'Dune' }))).toEqual([]);
  });

  it('keeps a default value of false rather than treating it as absent', () => {
    const prop = FormProp.create<Book>({
      type: PropType.Boolean,
      name: 'isPublished',
      defaultValue: false,
    });

    expect(prop.defaultValue).toBe(false);
  });
});

describe('groupFormProps', () => {
  const listOf = (...props: FormProp<Book>[]) => {
    const list = new FormPropList<Book>();
    list.addManyTail(props);
    return list;
  };

  it('collects the fields of one group, in the order they were contributed', () => {
    const grouped = groupFormProps(
      listOf(
        FormProp.create<Book>({
          type: PropType.String,
          name: 'street',
          group: { name: 'address' },
        }),
        FormProp.create<Book>({ type: PropType.String, name: 'name' }),
        FormProp.create<Book>({ type: PropType.String, name: 'city', group: { name: 'address' } }),
      ),
    );

    expect(grouped.map(entry => [entry.group?.name, entry.props.map(prop => prop.name)])).toEqual([
      ['address', ['street', 'city']],
      [undefined, ['name']],
    ]);
  });

  it('a form with no groups at all is one entry per field', () => {
    const grouped = groupFormProps(
      listOf(
        FormProp.create<Book>({ type: PropType.String, name: 'name' }),
        FormProp.create<Book>({ type: PropType.String, name: 'author' }),
      ),
    );

    expect(grouped).toHaveLength(2);
    expect(grouped.every(entry => entry.group === undefined)).toBe(true);
  });
});

describe('actions', () => {
  it('an entity action is visible and unrestricted unless it says otherwise', () => {
    const [action] = EntityAction.createMany<Book>([{ text: 'AbpUi::Edit', action: () => {} }]);

    expect(action?.visible()).toBe(true);
    expect(action?.permission).toBe('');
    expect(action?.icon).toBe('');
    expect(action?.showOnlyIcon).toBe(false);
  });

  it('a toolbar action is written over the page of records', () => {
    let seen: readonly Book[] = [];
    const action = ToolbarAction.create<Book[]>({
      text: 'AbpUi::Delete',
      action: data => {
        seen = data.record;
      },
    });

    action.action(dataFor([{ id: '1', name: 'Dune' }] as unknown as Book) as never);

    expect(seen).toEqual([{ id: '1', name: 'Dune' }]);
  });
});
