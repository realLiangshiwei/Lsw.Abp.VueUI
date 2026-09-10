import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type EntityActionList,
  type EntityPropList,
  type FormPropList,
  type ToolbarActionList,
} from '@lsw-abpvue/components';
import { ToasterService, Validators } from '@lsw-abpvue/theme-shared';
import { IdentityComponents } from '../modules/identity-demo/enums';
import type { IdentityDemoOptions } from '../modules/identity-demo/providers/identity-demo.provider';
import type { DemoUserDto } from '../modules/identity-demo/services/users.service';
import RolesCell from './RolesCell.vue';

/**
 * Everything an application can do to a module's pages without touching the module: this
 * whole file is the host's, and `modules/identity-demo` does not know it exists.
 *
 * One contributor per extension point, which is what the acceptance list of milestone 5
 * asks the playground to show.
 */

/** A column, placed after another one by name rather than by index. */
function addRolesColumn(propList: EntityPropList<DemoUserDto>): void {
  propList
    .add(
      EntityProp.create<DemoUserDto>({
        type: PropType.String,
        name: 'roles',
        displayName: 'AbpIdentity::Roles',
        columnWidth: 180,
        // A cell that is more than text is a component, never a string of HTML.
        component: RolesCell,
      }),
    )
    .after('userName', (prop, name) => prop.name === name);
}

/** A field on both forms, with a validator of the host's own. */
function addNicknameField(propList: FormPropList<DemoUserDto>): void {
  propList.addTail(
    FormProp.create<DemoUserDto>({
      type: PropType.String,
      name: 'nickname',
      displayName: 'AbpIdentity::DisplayName:Name',
      isExtra: true,
      validators: () => [Validators.maxLength(32)],
    }),
  );
}

/** A row button. `getInjected` is how a callback reaches a service from outside DI. */
function addGreetAction(actionList: EntityActionList<DemoUserDto>): void {
  actionList.addTail(
    EntityAction.create<DemoUserDto>({
      text: 'AbpAccount::PersonalInfo',
      icon: 'bi bi-hand-thumbs-up',
      action: data =>
        data.getInjected(ToasterService).info(`Hello, ${data.record.userName}.`, 'Extensions'),
    }),
  );
}

/** A toolbar button, which is handed the whole page of records. */
function addCountAction(actionList: ToolbarActionList<readonly DemoUserDto[]>): void {
  actionList.addTail(
    ToolbarAction.create<readonly DemoUserDto[]>({
      text: 'AbpUi::Total',
      icon: 'bi bi-123',
      action: data =>
        data
          .getInjected(ToasterService)
          .info(`${data.record.length} users on this page.`, 'Extensions'),
    }),
  );
}

/** A field the host takes off the edit form again. */
function dropIsActiveField(propList: FormPropList<DemoUserDto>): void {
  propList.dropByValue('isActive', (prop, name) => prop.name === name);
}

export const userContributors: IdentityDemoOptions = {
  entityPropContributors: { [IdentityComponents.Users]: [addRolesColumn] },
  createFormPropContributors: { [IdentityComponents.Users]: [addNicknameField] },
  editFormPropContributors: { [IdentityComponents.Users]: [addNicknameField, dropIsActiveField] },
  entityActionContributors: { [IdentityComponents.Users]: [addGreetAction] },
  toolbarActionContributors: { [IdentityComponents.Users]: [addCountAction] },
};
