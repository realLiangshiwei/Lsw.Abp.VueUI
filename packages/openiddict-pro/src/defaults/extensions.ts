import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type PropData,
} from '@lsw-abpvue/components';
import { LocalizationService } from '@lsw-abpvue/core';
import { OpenIddictProPolicyNames as Policy } from '@lsw-abpvue/openiddict-pro/config';
import type { ApplicationDto, ScopeDto } from '@lsw-abpvue/openiddict-pro/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';
import { OpenIddictProComponents as Keys } from '../enums/components.js';
import { APPLICATIONS_PAGE, SCOPES_PAGE } from '../tokens/pages.token.js';
import { allowFlow, UrisValidator } from '../utils/form-values.js';
import {
  defaultApplicationTypesList,
  defaultApplicationsTypeList,
  DefaultApplicationsConsentType,
  defaultClientAuthenticationMethods,
} from './options.js';

const values = (data?: PropData<ApplicationDto>): Record<string, unknown> =>
  data?.getInjected(APPLICATIONS_PAGE).values.value ?? {};
const left = { name: 'left', className: 'col-12 col-lg-6' };
const right = { name: 'right', className: 'col-12 col-lg-6' };

export const DEFAULT_APPLICATIONS_ENTITY_ACTIONS = EntityAction.createMany<ApplicationDto>([
  {
    text: 'AbpOpenIddict::Edit',
    permission: Policy.ApplicationUpdate,
    action: data => data.getInjected(APPLICATIONS_PAGE).edit(data.record),
  },
  {
    text: 'AbpOpenIddict::TokenLifetime',
    permission: Policy.ApplicationUpdate,
    action: data => data.getInjected(APPLICATIONS_PAGE).tokenLifetime(data.record),
  },
  {
    text: 'AbpOpenIddict::GenerateAccessToken',
    permission: Policy.ApplicationGenerateAccessToken,
    visible: data =>
      data?.record.clientType === 'confidential' && data?.record.allowClientCredentialsFlow,
    action: data => data.getInjected(APPLICATIONS_PAGE).generateAccessToken(data.record),
  },
  {
    text: 'AbpOpenIddict::ChangeHistory',
    permission: Policy.ApplicationChangeHistory,
    visible: data => Boolean(data?.getInjected(SHOW_ENTITY_HISTORY, null)),
    action: data =>
      data.getInjected(SHOW_ENTITY_HISTORY)(
        data.record.id ?? '',
        'Volo.Abp.OpenIddict.Applications.OpenIddictApplication',
      ),
  },
  {
    text: 'AbpOpenIddict::Permissions',
    permission: Policy.ApplicationManagePermissions,
    action: data => data.getInjected(APPLICATIONS_PAGE).permissions(data.record),
  },
  {
    text: 'LanguageManagement::Delete',
    permission: Policy.ApplicationDelete,
    action: data => data.getInjected(APPLICATIONS_PAGE).remove(data.record),
  },
]);
export const DEFAULT_SCOPE_ENTITY_ACTIONS = EntityAction.createMany<ScopeDto>([
  {
    text: 'AbpOpenIddict::Edit',
    permission: Policy.ScopeUpdate,
    action: data => data.getInjected(SCOPES_PAGE).edit(data.record),
  },
  {
    text: 'AbpOpenIddict::ChangeHistory',
    permission: Policy.ScopeChangeHistory,
    visible: data => Boolean(data?.getInjected(SHOW_ENTITY_HISTORY, null)),
    action: data =>
      data.getInjected(SHOW_ENTITY_HISTORY)(
        data.record.id ?? '',
        'Volo.Abp.OpenIddict.Scopes.OpenIddictScope',
      ),
  },
  {
    text: 'AbpOpenIddict::Delete',
    permission: Policy.ScopeDelete,
    action: data => data.getInjected(SCOPES_PAGE).remove(data.record),
  },
]);
export const DEFAULT_APPLICATIONS_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly ApplicationDto[]
>([
  {
    text: 'AbpOpenIddict::NewApplication',
    icon: 'bi bi-plus',
    permission: Policy.ApplicationCreate,
    action: data => data.getInjected(APPLICATIONS_PAGE).add(),
  },
]);
export const DEFAULT_SCOPES_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly ScopeDto[]>([
  {
    text: 'AbpOpenIddict::NewScope',
    icon: 'bi bi-plus',
    permission: Policy.ScopeCreate,
    action: data => data.getInjected(SCOPES_PAGE).add(),
  },
]);
export const DEFAULT_APPLICATIONS_ENTITY_PROPS = EntityProp.createMany<ApplicationDto>([
  {
    name: 'applicationType',
    displayName: 'AbpOpenIddict::ApplicationType',
    type: PropType.String,
    columnWidth: 100,
  },
  {
    name: 'clientId',
    displayName: 'AbpOpenIddict::ClientId',
    type: PropType.String,
    columnWidth: 200,
  },
  {
    name: 'displayName',
    displayName: 'AbpOpenIddict::DisplayName',
    type: PropType.String,
    columnWidth: 100,
  },
  {
    name: 'clientType',
    displayName: 'AbpOpenIddict::ClientType',
    type: PropType.String,
    columnWidth: 200,
  },
]);
export const DEFAULT_SCOPES_ENTITY_PROPS = EntityProp.createMany<ScopeDto>([
  { name: 'name', displayName: 'AbpOpenIddict::Name', type: PropType.String, columnWidth: 200 },
  {
    name: 'displayName',
    displayName: 'AbpOpenIddict::DisplayName',
    type: PropType.String,
    columnWidth: 200,
  },
  {
    name: 'description',
    displayName: 'AbpOpenIddict::Description',
    type: PropType.String,
    columnWidth: 200,
  },
]);

export const DEFAULT_APPLICATIONS_CREATE_FORM_PROPS = FormProp.createMany<ApplicationDto>([
  {
    name: 'applicationType',
    displayName: 'AbpOpenIddict::ApplicationType',
    type: PropType.Enum,
    group: left,
    options: () => defaultApplicationTypesList.map(({ key, value }) => ({ label: key, value })),
    validators: () => [Validators.required()],
  },
  ...(['clientId', 'displayName'] as const).map(name => ({
    name,
    displayName: `AbpOpenIddict::${name === 'clientId' ? 'ClientId' : 'DisplayName'}`,
    type: PropType.String,
    group: left,
    validators: () => [Validators.required()],
  })),
  {
    name: 'clientUri',
    displayName: 'AbpOpenIddict::ClientUri',
    type: PropType.String,
    group: left,
    validators: () => [UrisValidator()],
  },
  { name: 'logoUri', displayName: 'AbpOpenIddict::LogoUri', type: PropType.String, group: left },
  {
    name: 'clientType',
    displayName: 'AbpOpenIddict::ClientType',
    type: PropType.Enum,
    group: left,
    options: data => {
      const localization = data.getInjected(LocalizationService);
      return computed(() => [
        { label: localization.t('AbpUi::NotAssigned'), value: null },
        ...defaultApplicationsTypeList.map(({ key, value }) => ({ label: key, value })),
      ]);
    },
    validators: () => [Validators.required()],
  },
  {
    name: 'clientAuthMethod',
    displayName: 'AbpOpenIddict::ClientAuthenticationMethod',
    type: PropType.Enum,
    group: left,
    defaultValue: defaultClientAuthenticationMethods.secret,
    visible: data => values(data).clientType === 'confidential',
    options: data => {
      const localization = data.getInjected(LocalizationService);
      return computed(() =>
        Object.values(defaultClientAuthenticationMethods).map(value => ({
          label: localization.t(
            `AbpOpenIddict::${value === 'secret' ? 'ClientSecretMethod' : 'PrivateKeyJwtMethod'}`,
          ),
          value,
        })),
      );
    },
  },
  {
    name: 'clientSecret',
    displayName: 'AbpOpenIddict::ClientSecret',
    type: PropType.Password,
    group: left,
    formText: 'AbpOpenIddict::ClientSecretHelpText',
    visible: data =>
      values(data).clientType === 'confidential' && values(data).clientAuthMethod !== 'jwks',
  },
  {
    name: 'jsonWebKeySet',
    displayName: 'AbpOpenIddict::JsonWebKeySet',
    type: PropType.Text,
    group: left,
    formText: 'AbpOpenIddict::JsonWebKeySetHelpText',
    visible: data =>
      values(data).clientType === 'confidential' && values(data).clientAuthMethod === 'jwks',
  },
  ...(
    [
      'allowAuthorizationCodeFlow',
      'allowImplicitFlow',
      'allowHybridFlow',
      'allowPasswordFlow',
      'allowClientCredentialsFlow',
      'allowRefreshTokenFlow',
      'allowTokenExchangeFlow',
      'allowDeviceAuthorizationEndpoint',
      'forcePkce',
      'allowPushedAuthorizationEndpoint',
      'forcePushedAuthorization',
    ] as const
  ).map(name => {
    const displayName = `AbpOpenIddict::${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const confidentialOnly =
      name === 'allowClientCredentialsFlow' || name === 'allowDeviceAuthorizationEndpoint';
    return {
      name,
      displayName,
      type: PropType.Boolean,
      group: right,
      defaultValue: false,
      disabled: (data?: PropData<ApplicationDto>) => {
        const value = values(data);
        if (confidentialOnly) return value.clientType === 'public';
        if (name === 'allowRefreshTokenFlow')
          return !(
            value.allowHybridFlow ||
            value.allowAuthorizationCodeFlow ||
            value.allowPasswordFlow
          );
        return (
          name === 'allowPushedAuthorizationEndpoint' && value.forcePushedAuthorization === true
        );
      },
      displayTextResolver: confidentialOnly
        ? (data?: PropData<ApplicationDto>) => {
            const localization = data?.getInjected(LocalizationService);
            const label = localization?.t(displayName) ?? displayName;
            return values(data).clientType === 'public'
              ? `${label} (${localization?.t('AbpOpenIddict::NotAvailableForThisType')})`
              : label;
          }
        : undefined,
    };
  }),
  {
    name: 'consentType',
    displayName: 'AbpOpenIddict::ConsentType',
    type: PropType.Enum,
    group: right,
    options: () => DefaultApplicationsConsentType.map(({ key, value }) => ({ label: key, value })),
    visible: data => allowFlow(values(data)),
  },
  {
    name: 'extensionGrantTypes',
    displayName: 'AbpOpenIddict::ExtensionGrantTypes',
    type: PropType.Text,
    group: right,
  },
  {
    name: 'scopes',
    displayName: 'AbpOpenIddict::Scopes',
    type: PropType.MultiSelect,
    group: right,
    defaultValue: [],
    options: data => {
      const page = data.getInjected(APPLICATIONS_PAGE);
      return computed(() =>
        page.scopes.value.flatMap(scope =>
          scope.name ? [{ label: scope.name, value: scope.name }] : [],
        ),
      );
    },
  },
  {
    name: 'redirectUris',
    displayName: 'AbpOpenIddict::RedirectUris',
    type: PropType.Text,
    group: right,
    validators: () => [UrisValidator()],
    visible: data => allowFlow(values(data)),
  },
  {
    name: 'allowEndSessionEndpoint',
    displayName: 'AbpOpenIddict::AllowEndSessionEndpoint',
    type: PropType.Boolean,
    group: right,
    defaultValue: false,
    visible: data => allowFlow(values(data)),
  },
  {
    name: 'postLogoutRedirectUris',
    displayName: 'AbpOpenIddict::PostLogoutRedirectUris',
    type: PropType.Text,
    group: right,
    validators: () => [UrisValidator()],
    visible: data => values(data).allowEndSessionEndpoint === true,
  },
]);
export const DEFAULT_APPLICATIONS_FORM_PROPS = DEFAULT_APPLICATIONS_CREATE_FORM_PROPS;
export const DEFAULT_SCOPE_CREATE_FORM_PROPS = FormProp.createMany<ScopeDto>([
  {
    name: 'name',
    displayName: 'AbpOpenIddict::Name',
    type: PropType.String,
    validators: () => [Validators.required(), Validators.pattern(/^\S+$/)],
  },
  { name: 'displayName', displayName: 'AbpOpenIddict::DisplayName', type: PropType.String },
  { name: 'description', displayName: 'AbpOpenIddict::Description', type: PropType.String },
  { name: 'resources', displayName: 'AbpOpenIddict::Resources', type: PropType.Text },
]);
export const DEFAULT_SCOPES_FORM_PROPS = DEFAULT_SCOPE_CREATE_FORM_PROPS;
export const DEFAULT_OPENIDDICT_PRO_ENTITY_ACTIONS = {
  [Keys.Applications]: DEFAULT_APPLICATIONS_ENTITY_ACTIONS,
  [Keys.Scopes]: DEFAULT_SCOPE_ENTITY_ACTIONS,
};
export const DEFAULT_OPENIDDICT_PRO_TOOLBAR_ACTIONS = {
  [Keys.Applications]: DEFAULT_APPLICATIONS_TOOLBAR_ACTIONS,
  [Keys.Scopes]: DEFAULT_SCOPES_TOOLBAR_ACTIONS,
};
export const DEFAULT_OPENIDDICT_PRO_ENTITY_PROPS = {
  [Keys.Applications]: DEFAULT_APPLICATIONS_ENTITY_PROPS,
  [Keys.Scopes]: DEFAULT_SCOPES_ENTITY_PROPS,
};
export const DEFAULT_OPENIDDICT_PRO_CREATE_FORM_PROPS = {
  [Keys.Applications]: DEFAULT_APPLICATIONS_CREATE_FORM_PROPS,
  [Keys.Scopes]: DEFAULT_SCOPE_CREATE_FORM_PROPS,
};
export const DEFAULT_OPENIDDICT_PRO_EDIT_FORM_PROPS = {
  [Keys.Applications]: DEFAULT_APPLICATIONS_FORM_PROPS,
  [Keys.Scopes]: DEFAULT_SCOPES_FORM_PROPS,
};
