import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
} from '@lsw-abpvue/components';
import { SaasPolicyNames } from '@lsw-abpvue/saas/config';
import type { EditionDto } from '@lsw-abpvue/saas/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';
import { SAAS_EDITIONS_PAGE } from '../tokens/pages.token.js';

export const DEFAULT_EDITIONS_ENTITY_PROPS = EntityProp.createMany<EditionDto>([
  { name: 'displayName', type: PropType.String, displayName: 'Saas::EditionName', sortable: true },
  { name: 'tenantCount', type: PropType.Number, displayName: 'Saas::TenantCount' },
]);

export const DEFAULT_EDITIONS_FORM_PROPS = FormProp.createMany<EditionDto>([
  {
    name: 'displayName',
    type: PropType.String,
    displayName: 'Saas::EditionName',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    name: 'planId',
    type: PropType.Enum,
    displayName: 'Saas::PlanId',
    defaultValue: null,
    visible: data => (data?.getInjected(SAAS_EDITIONS_PAGE).planOptions.value.length ?? 0) > 1,
    options: data => data.getInjected(SAAS_EDITIONS_PAGE).planOptions,
  },
]);

export const DEFAULT_EDITIONS_ENTITY_ACTIONS = EntityAction.createMany<EditionDto>([
  {
    text: 'Saas::Edit',
    permission: SaasPolicyNames.EditionsUpdate,
    action: data => data.getInjected(SAAS_EDITIONS_PAGE).edit(data.record),
  },
  {
    text: 'Saas::Features',
    permission: SaasPolicyNames.EditionsManageFeatures,
    action: data => data.getInjected(SAAS_EDITIONS_PAGE).manageFeatures(data.record),
  },
  {
    text: 'Saas::ChangeHistory',
    permission: SaasPolicyNames.EditionsChangeHistory,
    visible: data => !!data?.getInjected(SHOW_ENTITY_HISTORY, undefined, { optional: true }),
    action: data => data.getInjected(SAAS_EDITIONS_PAGE).viewHistory(data.record),
  },
  {
    text: 'Saas::Delete',
    permission: SaasPolicyNames.EditionsDelete,
    action: data => data.getInjected(SAAS_EDITIONS_PAGE).remove(data.record),
  },
  {
    text: 'Saas::MoveAllTenants',
    permission: SaasPolicyNames.TenantsUpdate,
    action: data => data.getInjected(SAAS_EDITIONS_PAGE).moveAllTenants(data.record),
  },
]);

export const DEFAULT_EDITIONS_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly EditionDto[]>([
  {
    text: 'Saas::NewEdition',
    icon: 'bi bi-plus',
    permission: SaasPolicyNames.EditionsCreate,
    action: data => data.getInjected(SAAS_EDITIONS_PAGE).add(),
  },
]);
