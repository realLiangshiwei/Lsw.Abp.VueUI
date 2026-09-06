import { describe, expectTypeOf, it } from 'vitest';
import { PropType } from './enums/prop-type.js';
import { EntityAction, EntityActionsFactory, type EntityActionList } from './models/actions.js';
import { EntityProp, EntityPropsFactory, type EntityPropList } from './models/entity-props.js';
import { FormProp, FormPropsFactory } from './models/form-props.js';
import { unwrapResolvable } from './models/prop-data.js';
import { mergeWithDefaultActions, mergeWithDefaultProps } from './utils/merge.js';

interface Book {
  id: string;
  name: string;
}

const USERS = 'Identity.UsersComponent';

describe('the extension point types', () => {
  it('a registry hands back the list of the record type asked for', () => {
    const factory = new EntityPropsFactory();

    expectTypeOf(factory.get<Book>(USERS).props).toEqualTypeOf<EntityPropList<Book>>();
    expectTypeOf(factory.get<Book>(USERS).props.toArray()).toEqualTypeOf<EntityProp<Book>[]>();
  });

  it('a callback written against the record type is accepted as a contributor', () => {
    mergeWithDefaultProps(
      new EntityPropsFactory(),
      { [USERS]: [EntityProp.create<Book>({ type: PropType.String, name: 'name' })] },
      {
        [USERS]: [
          (propList: EntityPropList<Book>) =>
            propList.addTail(EntityProp.create<Book>({ type: PropType.String, name: 'id' })),
        ],
      },
    );

    mergeWithDefaultActions(
      new EntityActionsFactory(),
      { [USERS]: [EntityAction.create<Book>({ text: 'AbpUi::Edit', action: () => {} })] },
      {
        [USERS]: [
          (actionList: EntityActionList<Book>) =>
            actionList.addTail(
              EntityAction.create<Book>({ text: 'AbpUi::Delete', action: () => {} }),
            ),
        ],
      },
    );
  });

  it('the callbacks see the record they were promised', () => {
    EntityProp.create<Book>({
      type: PropType.String,
      name: 'name',
      valueResolver: data => {
        expectTypeOf(data.record).toEqualTypeOf<Book>();
        return data.record.name;
      },
      visible: data => {
        expectTypeOf(data?.record).toEqualTypeOf<Book | undefined>();
        return true;
      },
    });

    EntityAction.create<Book[]>({
      text: 'AbpUi::Delete',
      action: data => {
        expectTypeOf(data.record).toEqualTypeOf<Book[]>();
      },
    });
  });

  it('refuses the wrong kind of default for a registry', () => {
    mergeWithDefaultProps(new FormPropsFactory(), {
      [USERS]: [FormProp.create<Book>({ type: PropType.String, name: 'name' })],
    });

    // @ts-expect-error a form field is not a column, and the registry says so
    mergeWithDefaultProps(new EntityPropsFactory(), {
      [USERS]: [FormProp.create<Book>({ type: PropType.String, name: 'name' })],
    });
  });

  it('a resolvable value comes back as a ref of what it resolves to', () => {
    expectTypeOf(unwrapResolvable(Promise.resolve('a')).value).toEqualTypeOf<string | undefined>();
    expectTypeOf(unwrapResolvable(() => 1).value).toEqualTypeOf<number | undefined>();
  });
});
