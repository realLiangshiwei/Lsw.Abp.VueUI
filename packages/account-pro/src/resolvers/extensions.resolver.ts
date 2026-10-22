import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
} from '@lsw-abpvue/components';
import { getCurrentInjector } from '@lsw-abpvue/core';
import type { IdentitySecurityLogDto, ProfileDto } from '@lsw-abpvue/account-pro/proxy';
import {
  AccountProProfileTabs,
  configureAccountProProfileTabs,
} from '@lsw-abpvue/account-pro/config';
import {
  PersonalSettingsTab,
  ProfilePictureTab,
  ChangePasswordTab,
  AuthenticatorAppTab,
  TwoFactorTab,
} from '../components/profile-tabs.js';
import { DEFAULT_ACCOUNT_PRO_PERSONAL_SETTINGS_FORM_PROPS } from '../defaults/personal-settings.js';
import {
  DEFAULT_MY_SECURITY_LOGS_ENTITY_PROPS,
  DEFAULT_MY_SECURITY_LOGS_ENTITY_ACTIONS,
  DEFAULT_MY_SECURITY_LOGS_TOOLBAR_ACTIONS,
} from '../defaults/security-logs.js';
import { AccountProComponents } from '../enums/components.js';
import { ACCOUNT_PRO_CONFIG_OPTIONS } from '../tokens/config-options.token.js';

export function accountProExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;
  configureAccountProProfileTabs({
    [AccountProProfileTabs.PersonalInfo]: PersonalSettingsTab,
    [AccountProProfileTabs.ProfilePicture]: ProfilePictureTab,
    [AccountProProfileTabs.ChangePassword]: ChangePasswordTab,
    [AccountProProfileTabs.AuthenticatorApp]: AuthenticatorAppTab,
    [AccountProProfileTabs.TwoFactor]: TwoFactorTab,
  });
  const extensions = injector.get(ExtensionsService);
  const options = injector.get(ACCOUNT_PRO_CONFIG_OPTIONS);
  const key = AccountProComponents.MySecurityLogs;
  const account = getObjectExtensionEntities(injector, 'Account');
  const securityLogs = mapEntitiesToContributors<IdentitySecurityLogDto>(
    injector,
    { [key]: account.SecurityLogs },
    'AbpAccount',
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    { [key]: DEFAULT_MY_SECURITY_LOGS_ENTITY_PROPS },
    securityLogs.prop,
    { [key]: options.entityPropContributors?.[key] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    { [key]: DEFAULT_MY_SECURITY_LOGS_ENTITY_ACTIONS },
    { [key]: options.entityActionContributors?.[key] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [key]: DEFAULT_MY_SECURITY_LOGS_TOOLBAR_ACTIONS },
    { [key]: options.toolbarActionContributors?.[key] ?? [] },
  );
  const personal = AccountProComponents.PersonalSettings;
  const entities = getObjectExtensionEntities(injector, 'Identity');
  const backend = mapEntitiesToContributors<ProfileDto>(
    injector,
    { [personal]: entities.User },
    'AbpIdentity',
  );
  mergeWithDefaultProps(
    extensions.editFormProps,
    { [personal]: DEFAULT_ACCOUNT_PRO_PERSONAL_SETTINGS_FORM_PROPS },
    backend.editForm,
    {
      [personal]:
        options.editFormPropContributors?.[personal] ??
        options.personelInfoEntityPropContributors?.[personal] ??
        [],
    },
  );
}
