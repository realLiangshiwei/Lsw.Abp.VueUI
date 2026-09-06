import { describe, expect, it } from 'vitest';
import { PropType } from '../enums/prop-type.js';
import { EntityAction, EntityActionsFactory, type EntityActionList } from '../models/actions.js';
import { EntityProp, EntityPropsFactory, type EntityPropList } from '../models/entity-props.js';
import { FormProp, FormPropsFactory } from '../models/form-props.js';
import { mergeWithDefaultActions, mergeWithDefaultProps } from './merge.js';

interface Book {
  id: string;
  name: string;
}

const USERS = 'Identity.UsersComponent';

const column = (name: string) => EntityProp.create<Book>({ type: PropType.String, name });

const defaults = { [USERS]: [column('name'), column('author')] };

describe('mergeWithDefaultProps', () => {
  it('starts from the module defaults', () => {
    const factory = new EntityPropsFactory();

    mergeWithDefaultProps(factory, defaults);

    expect(
      factory
        .get<Book>(USERS)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['name', 'author']);
  });

  it('runs the contributor sets in the order they were passed', () => {
    const factory = new EntityPropsFactory();
    const fromBackend = {
      [USERS]: [(propList: EntityPropList<Book>) => propList.addTail(column('Isbn'))],
    };
    const fromApplication = {
      [USERS]: [
        (propList: EntityPropList<Book>) =>
          propList.add(column('price')).after('Isbn', (prop, name) => prop.name === name),
      ],
    };

    mergeWithDefaultProps(factory, defaults, fromBackend, fromApplication);

    expect(
      factory
        .get<Book>(USERS)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['name', 'author', 'Isbn', 'price']);
  });

  it('a later contributor can undo what an earlier one did', () => {
    const factory = new EntityPropsFactory();

    mergeWithDefaultProps(factory, defaults, {
      [USERS]: [
        propList => propList.dropByValue('author', (prop, name) => prop.name === name),
        propList => propList.addHead(column('id')),
      ],
    });

    expect(
      factory
        .get<Book>(USERS)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['id', 'name']);
  });

  it('assembling twice leaves the same list, not two copies of it', () => {
    const factory = new EntityPropsFactory();
    const contributors = {
      [USERS]: [(propList: EntityPropList<Book>) => propList.addTail(column('Isbn'))],
    };

    mergeWithDefaultProps(factory, defaults, contributors);
    mergeWithDefaultProps(factory, defaults, contributors);

    expect(
      factory
        .get<Book>(USERS)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['name', 'author', 'Isbn']);
  });

  it('every read runs the contributors again, so a predicate sees the current state', () => {
    const factory = new EntityPropsFactory();
    let extra = false;

    mergeWithDefaultProps(factory, defaults, {
      [USERS]: [propList => (extra ? propList.addTail(column('Isbn')) : undefined)],
    });

    expect(factory.get<Book>(USERS).props.length).toBe(2);

    extra = true;

    expect(factory.get<Book>(USERS).props.length).toBe(3);
  });

  it('a contributor registered under a key the module does not have changes nothing', () => {
    const factory = new EntityPropsFactory();

    mergeWithDefaultProps(factory, defaults, {
      'Identity.UserComponent': [propList => propList.addTail(column('Isbn'))],
    });

    expect(
      factory
        .get<Book>(USERS)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['name', 'author']);
  });

  it('the create and edit forms are separate registries', () => {
    const createForm = new FormPropsFactory();
    const editForm = new FormPropsFactory();
    const field = (name: string) => FormProp.create<Book>({ type: PropType.String, name });

    mergeWithDefaultProps(createForm, { [USERS]: [field('name'), field('password')] });
    mergeWithDefaultProps(editForm, { [USERS]: [field('name')] });

    expect(createForm.get<Book>(USERS).props.length).toBe(2);
    expect(editForm.get<Book>(USERS).props.length).toBe(1);
  });
});

describe('mergeWithDefaultActions', () => {
  const remove = EntityAction.create<Book>({ text: 'AbpUi::Delete', action: () => {} });

  it('assembles the row buttons the same way the columns are assembled', () => {
    const factory = new EntityActionsFactory();

    mergeWithDefaultActions(
      factory,
      { [USERS]: [remove] },
      {
        [USERS]: [
          (actionList: EntityActionList<Book>) =>
            actionList.addHead(
              EntityAction.create<Book>({ text: 'AbpUi::Edit', action: () => {} }),
            ),
        ],
      },
    );

    expect(
      factory
        .get<Book>(USERS)
        .actions.toArray()
        .map(action => action.text),
    ).toEqual(['AbpUi::Edit', 'AbpUi::Delete']);
  });

  it('clearing the contributors leaves nothing behind', () => {
    const factory = new EntityActionsFactory();

    mergeWithDefaultActions(factory, { [USERS]: [remove] });
    factory.get<Book>(USERS).clearContributors();

    expect(factory.get<Book>(USERS).actions.length).toBe(0);
  });
});
