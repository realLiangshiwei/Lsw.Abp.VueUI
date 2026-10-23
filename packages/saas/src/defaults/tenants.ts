import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
} from '@lsw-abpvue/components';
import { ConfigStateService, EnvironmentService, LocalizationService } from '@lsw-abpvue/core';
import { SAAS_CONNECTION_STRING_SETTING, SaasPolicyNames } from '@lsw-abpvue/saas/config';
import {
  TenantActivationState,
  tenantActivationStateOptions,
  type SaasTenantDto,
} from '@lsw-abpvue/saas/proxy';
import { getPasswordValidators, Validators } from '@lsw-abpvue/theme-shared';
import { SAAS_TENANTS_PAGE } from '../tokens/pages.token.js';
import { canImpersonateTenant } from '../utils/tenant.js';

export const DEFAULT_TENANTS_ENTITY_PROPS = EntityProp.createMany<SaasTenantDto>([
  { name: 'name', type: PropType.String, displayName: 'Saas::TenantName', sortable: true },
  { name: 'editionName', type: PropType.String, displayName: 'Saas::EditionName' },
  {
    name: 'editionEndDateUtc',
    type: PropType.DateTime,
    displayName: 'Saas::EditionEndDateUtc',
    tooltip: { text: 'Saas::EditionEndDateToolTip' },
  },
  {
    name: 'activationState',
    type: PropType.String,
    displayName: 'Saas::ActivationState',
    valueResolver: data => {
      const localization = data.getInjected(LocalizationService);
      const tenant = data.record;
      const state = TenantActivationState[tenant.activationState];
      const label = state ? localization.t(`Saas::Enum:TenantActivationState.${state}`) : '';
      const end = Date.parse(tenant.activationEndDate ?? '');
      return tenant.activationState === TenantActivationState.ActiveWithLimitedTime &&
        Number.isFinite(end)
        ? `${label} (${new Date(end).toLocaleString(localization.currentLang.value)})`
        : label;
    },
  },
]);

export const DEFAULT_TENANTS_CREATE_FORM_PROPS = FormProp.createMany<SaasTenantDto>([
  {
    name: 'name',
    type: PropType.String,
    displayName: 'Saas::TenantName',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    name: 'editionId',
    type: PropType.Enum,
    displayName: 'Saas::Edition',
    defaultValue: null,
    options: data => data.getInjected(SAAS_TENANTS_PAGE).editionOptions,
    disabled: data => Date.parse(data?.record.editionEndDateUtc ?? '') < Date.now(),
  },
  {
    name: 'adminEmailAddress',
    type: PropType.Email,
    displayName: 'Saas::DisplayName:AdminEmailAddress',
    formText: 'Saas::DisplayName:AdminEmailAddressFormText',
    validators: () => [Validators.required(), Validators.email(), Validators.maxLength(256)],
  },
  {
    name: 'adminPassword',
    type: PropType.PasswordInputGroup,
    displayName: 'Saas::DisplayName:AdminPassword',
    autocomplete: 'new-password',
    validators: data => [Validators.required(), ...getPasswordValidators(data.getInjected)],
  },
  {
    name: 'activationState',
    type: PropType.Enum,
    displayName: 'Saas::DisplayName:ActivationState',
    defaultValue: TenantActivationState.Active,
    validators: () => [Validators.required()],
    options: data => {
      const localization = data.getInjected(LocalizationService);
      return tenantActivationStateOptions.map(option => ({
        value: option.value,
        label: localization.t(`Saas::Enum:TenantActivationState.${option.key}`),
      }));
    },
  },
  {
    name: 'activationEndDate',
    type: PropType.DateTime,
    displayName: 'Saas::DisplayName:ActivationEndDate',
    visible: data =>
      data?.getInjected(SAAS_TENANTS_PAGE).formValues.value['activationState'] ===
      TenantActivationState.ActiveWithLimitedTime,
    validators: () => [
      (value, context) =>
        context.valueOf('activationState') === TenantActivationState.ActiveWithLimitedTime
          ? Validators.required()(value, context)
          : null,
    ],
  },
]);

export const DEFAULT_TENANTS_EDIT_FORM_PROPS = DEFAULT_TENANTS_CREATE_FORM_PROPS.filter(
  prop => !['adminEmailAddress', 'adminPassword'].includes(prop.name),
);

export const DEFAULT_TENANTS_ENTITY_ACTIONS = EntityAction.createMany<SaasTenantDto>([
  {
    text: 'Saas::Edit',
    permission: SaasPolicyNames.TenantsUpdate,
    action: data => data.getInjected(SAAS_TENANTS_PAGE).edit(data.record),
  },
  {
    text: 'Saas::ConnectionStrings',
    permission: SaasPolicyNames.TenantsManageConnectionStrings,
    visible: data =>
      data?.getInjected(ConfigStateService).getSetting(SAAS_CONNECTION_STRING_SETTING).value ===
      'True',
    action: data => data.getInjected(SAAS_TENANTS_PAGE).manageConnectionStrings(data.record),
  },
  {
    text: 'Saas::ApplyDatabaseMigrations',
    permission: SaasPolicyNames.TenantsManageConnectionStrings,
    visible: data => data?.record.hasDefaultConnectionString === true,
    action: data => data.getInjected(SAAS_TENANTS_PAGE).applyDatabaseMigrations(data.record),
  },
  {
    text: 'Saas::Features',
    permission: SaasPolicyNames.TenantsManageFeatures,
    action: data => data.getInjected(SAAS_TENANTS_PAGE).manageFeatures(data.record),
  },
  {
    text: 'Saas::ChangeHistory',
    permission: SaasPolicyNames.TenantsChangeHistory,
    visible: data => !!data?.getInjected(SHOW_ENTITY_HISTORY, undefined, { optional: true }),
    action: data => data.getInjected(SAAS_TENANTS_PAGE).viewHistory(data.record),
  },
  {
    text: 'Saas::LoginWithThisTenant',
    permission: SaasPolicyNames.TenantsImpersonation,
    visible: data =>
      !!data &&
      canImpersonateTenant(
        data.record,
        data.getInjected(ConfigStateService),
        data.getInjected(EnvironmentService),
      ),
    action: data => data.getInjected(SAAS_TENANTS_PAGE).operate(data.record, 'impersonate'),
  },
  {
    text: 'Saas::SetPassword',
    permission: SaasPolicyNames.TenantsSetPassword,
    action: data => data.getInjected(SAAS_TENANTS_PAGE).operate(data.record, 'password'),
  },
  {
    text: 'Saas::InviteUser',
    permission: SaasPolicyNames.TenantsCreate,
    action: data => data.getInjected(SAAS_TENANTS_PAGE).operate(data.record, 'invite'),
  },
  {
    text: 'Saas::Delete',
    permission: SaasPolicyNames.TenantsDelete,
    action: data => data.getInjected(SAAS_TENANTS_PAGE).remove(data.record),
  },
]);

export const DEFAULT_TENANTS_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly SaasTenantDto[]>([
  {
    text: 'Saas::NewTenant',
    icon: 'bi bi-plus',
    permission: SaasPolicyNames.TenantsCreate,
    action: data => data.getInjected(SAAS_TENANTS_PAGE).add(),
  },
]);
