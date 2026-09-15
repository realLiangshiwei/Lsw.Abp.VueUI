import { AccountComponents } from '@lsw-abpvue/account-core';
import type { ProfileDto } from '@lsw-abpvue/account-core/proxy';
import { ExtensionsService, mergeWithDefaultProps, type FormProp } from '@lsw-abpvue/components';
import { getCurrentInjector } from '@lsw-abpvue/core';
import { DEFAULT_PERSONAL_SETTINGS_FORM_PROPS } from '../defaults/personal-settings.js';
import type { AccountFormPropContributors } from '../models/config-options.js';
import { ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS } from '../tokens/config-options.token.js';

/**
 * Assembles the personal settings form before the profile page renders. There is only
 * one extension point here: the profile has no table and no row buttons, and creating a
 * profile is what registration is.
 *
 * The profile is not an extensible entity on the server, so nothing comes from
 * `objectExtensions` -- a property added to the user shows up in identity's forms, not in
 * this one.
 */
export function accountExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const contributors: AccountFormPropContributors =
    injector.get(ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS, {}, { optional: true }) ?? {};

  mergeWithDefaultProps<FormProp<ProfileDto>>(
    injector.get(ExtensionsService).editFormProps,
    { [AccountComponents.PersonalSettings]: DEFAULT_PERSONAL_SETTINGS_FORM_PROPS },
    {
      [AccountComponents.PersonalSettings]: contributors[AccountComponents.PersonalSettings] ?? [],
    },
  );
}
