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
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type {
  IdentityProConfigOptions,
  IdentityProFormPropContributors,
} from '@lsw-abpvue/identity-pro';
import { ToasterService } from '@lsw-abpvue/theme-shared';
import FullNameCell from './FullNameCell.vue';

/**
 * Everything an application can do to a module's pages without touching the module: this
 * whole file is the host's, and `@lsw-abpvue/identity` does not know it exists.
 *
 * One contributor per extension point, which is what the acceptance list of milestone 5
 * asks the playground to show -- now against the real module rather than a stand-in.
 */

/** A column, placed after another one by name rather than by index. */
function addFullNameColumn<R>(propList: EntityPropList<R>): void {
  propList
    .add(
      EntityProp.create<R>({
        type: PropType.String,
        name: 'fullName',
        displayName: 'AbpIdentity::DisplayName:Name',
        columnWidth: 180,
        // A cell that is more than text is a component, never a string of HTML.
        component: FullNameCell,
      }),
    )
    .after('userName', (prop, name) => prop.name === name);
}

/** A field the host takes off the create form; the server does not require it. */
function dropPhoneNumberField<R>(propList: FormPropList<R>): void {
  propList.dropByValue('phoneNumber', (prop, name) => prop.name === name);
}

/** A row button. `getInjected` is how a callback reaches a service from outside DI. */
function addGreetAction<R extends { userName?: string | undefined }>(
  actionList: EntityActionList<R>,
): void {
  actionList.addTail(
    EntityAction.create<R>({
      // A key with no resource passes through the localizer unchanged, which is how a
      // host labels something ABP has no word for.
      text: 'Greet',
      icon: 'bi bi-hand-thumbs-up',
      action: data =>
        data.getInjected(ToasterService).info(`Hello, ${data.record.userName}.`, 'Extensions'),
    }),
  );
}

/** A toolbar button, which is handed the whole page of records. */
function addCountAction<R>(actionList: ToolbarActionList<readonly R[]>): void {
  actionList.addTail(
    ToolbarAction.create<readonly R[]>({
      text: 'AbpUi::Total',
      icon: 'bi bi-123',
      action: data =>
        data
          .getInjected(ToasterService)
          .info(`${data.record.length} users on this page.`, 'Extensions'),
    }),
  );
}

export const userContributors: IdentityConfigOptions = {
  entityPropContributors: { [IdentityComponents.Users]: [addFullNameColumn] },
  createFormPropContributors: { [IdentityComponents.Users]: [dropPhoneNumberField] },
  entityActionContributors: { [IdentityComponents.Users]: [addGreetAction] },
  toolbarActionContributors: { [IdentityComponents.Users]: [addCountAction] },
};

function readOnlyFixtureTag<R>(props: FormPropList<R>): void {
  const index = props.toArray().findIndex(prop => prop.name === 'E2eReadOnlyTag');
  if (index < 0)
    throw new TypeError('The opt-in extension fixture requires the real E2eReadOnlyTag field.');
  const existing = props.dropByIndex(index)?.value;
  if (!existing)
    throw new TypeError('The opt-in extension fixture requires the real E2eReadOnlyTag field.');
  props.addByIndex(FormProp.create({ ...existing, readonly: () => true }), index);
}

const fixtureForms: IdentityProFormPropContributors =
  import.meta.env.VITE_PRO_E2E_EXTENSION_FIELDS === '1'
    ? {
        [IdentityComponents.Users]: [readOnlyFixtureTag],
        [IdentityComponents.Roles]: [readOnlyFixtureTag],
        'Identity.ClaimsComponent': [readOnlyFixtureTag],
        'Identity.OrganizationUnitsComponent': [readOnlyFixtureTag],
      }
    : {};

export const proUserContributors: IdentityProConfigOptions = {
  entityPropContributors: { [IdentityComponents.Users]: [addFullNameColumn] },
  entityActionContributors: { [IdentityComponents.Users]: [addGreetAction] },
  toolbarActionContributors: { [IdentityComponents.Users]: [addCountAction] },
  createFormPropContributors: fixtureForms,
  editFormPropContributors: fixtureForms,
};
