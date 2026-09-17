import { AccountComponents } from '@lsw-abpvue/account-core';
import type { ProfileDto } from '@lsw-abpvue/account-core/proxy';
import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultProps,
  type FormProp,
} from '@lsw-abpvue/components';
import { getCurrentInjector } from '@lsw-abpvue/core';
import { DEFAULT_PERSONAL_SETTINGS_FORM_PROPS } from '../defaults/personal-settings.js';
import type { AccountFormPropContributors } from '../models/config-options.js';
import { ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS } from '../tokens/config-options.token.js';

/**
 * Assembles the personal settings form before the profile page renders. There is only
 * one extension point here: the profile has no table and no row buttons, and creating a
 * profile is what registration is.
 *
 * The user's own object extensions belong on it. `UpdateProfileDto` carries the same
 * `extraProperties` the identity module's user does, so a property the backend requires
 * has to have a field here as well -- without one, saving the profile is refused for a
 * value the page never asked for.
 */
export function accountExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const contributors: AccountFormPropContributors =
    injector.get(ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS, {}, { optional: true }) ?? {};

  const entities = getObjectExtensionEntities(injector, 'Identity');
  const fromBackend = mapEntitiesToContributors<ProfileDto>(
    injector,
    { [AccountComponents.PersonalSettings]: entities.User },
    'AbpIdentity',
  );

  mergeWithDefaultProps<FormProp<ProfileDto>>(
    injector.get(ExtensionsService).editFormProps,
    { [AccountComponents.PersonalSettings]: DEFAULT_PERSONAL_SETTINGS_FORM_PROPS },
    fromBackend.editForm,
    {
      [AccountComponents.PersonalSettings]: contributors[AccountComponents.PersonalSettings] ?? [],
    },
  );
}
