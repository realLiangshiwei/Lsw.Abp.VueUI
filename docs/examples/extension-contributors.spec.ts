import { describe, expect, it } from 'vitest';
import {
  EntityAction,
  EntityActionList,
  EntityProp,
  EntityPropList,
  FormProp,
  FormPropList,
  PropType,
} from '@lsw-abpvue/components';
import { IdentityComponents } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import ContactCell from './ContactCell.vue';
import { userActions } from './user-actions.js';
import { userColumns } from './user-columns.js';
import { userFormFields } from './user-form-fields.js';

describe('documented users page contributors', () => {
  it('replaces email with a contact component after the username', () => {
    const props = new EntityPropList<IdentityUserDto>();
    for (const name of ['userName', 'email', 'surname']) {
      props.addTail(EntityProp.create({ name, type: PropType.String }));
    }
    for (const contribute of userColumns.entityPropContributors[IdentityComponents.Users]) {
      contribute(props);
    }

    expect(props.toArray().map(prop => prop.name)).toEqual(['userName', 'contact', 'surname']);
    const contact = props.toArray().find(prop => prop.name === 'contact');
    expect(contact?.component).toBe(ContactCell);
    expect(contact?.sortable).toBe(false);
  });

  it('replaces Edit while retaining other record actions', () => {
    const actions = new EntityActionList<IdentityUserDto>();
    for (const text of ['AbpUi::Edit', 'AbpUi::Delete']) {
      actions.addTail(EntityAction.create({ text, action: () => undefined }));
    }
    for (const contribute of userActions.entityActionContributors[IdentityComponents.Users]) {
      contribute(actions);
    }

    expect(actions.toArray().map(action => action.text)).toEqual(['AbpUi::Edit', 'AbpUi::Delete']);
    const edit = actions.toArray()[0];
    expect(edit?.permission).toBe('AbpIdentity.Users.Update');
    expect(edit?.visible()).toBe(false);
  });

  it('keeps a single extra field when the contributor is applied again', () => {
    const props = new FormPropList<IdentityUserDto>();
    props.addTail(FormProp.create({ name: 'surname', type: PropType.String }));
    const contributors = userFormFields.createFormPropContributors[IdentityComponents.Users];
    for (let pass = 0; pass < 2; pass++) {
      for (const contribute of contributors) contribute(props);
    }

    expect(props.toArray().map(prop => prop.name)).toEqual(['surname', 'SocialSecurityNumber']);
    const extra = props.toArray()[1];
    expect(extra?.isExtra).toBe(true);
    expect(extra?.defaultValue).toBe('');
    expect(userFormFields.editFormPropContributors[IdentityComponents.Users]).toEqual(contributors);
  });
});
