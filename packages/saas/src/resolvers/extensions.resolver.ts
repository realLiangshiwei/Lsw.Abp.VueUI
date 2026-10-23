import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  type EntityAction,
  type EntityActionContributorCallback,
  type EntityProp,
  type EntityPropContributorCallback,
  type FormProp,
  type FormPropContributorCallback,
  type ToolbarAction,
  type ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { getCurrentInjector, type EntityExtensionDto, type Injector } from '@lsw-abpvue/core';
import type { EditionDto, SaasTenantDto } from '@lsw-abpvue/saas/proxy';
import * as editions from '../defaults/editions.js';
import * as tenants from '../defaults/tenants.js';
import { SaasComponents } from '../enums/components.js';
import {
  SAAS_CREATE_FORM_PROP_CONTRIBUTORS,
  SAAS_EDIT_FORM_PROP_CONTRIBUTORS,
  SAAS_ENTITY_ACTION_CONTRIBUTORS,
  SAAS_ENTITY_PROP_CONTRIBUTORS,
  SAAS_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/** Assembles defaults, backend object extensions and application contributions in order. */
export function saasExtensionsResolver(): void {
  const current = getCurrentInjector();
  if (!current) return;
  const injector: Injector = current;
  const extensions = injector.get(ExtensionsService);
  const optional = { optional: true } as const;
  const props = injector.get(SAAS_ENTITY_PROP_CONTRIBUTORS, undefined, optional);
  const create = injector.get(SAAS_CREATE_FORM_PROP_CONTRIBUTORS, undefined, optional);
  const edit = injector.get(SAAS_EDIT_FORM_PROP_CONTRIBUTORS, undefined, optional);
  const actions = injector.get(SAAS_ENTITY_ACTION_CONTRIBUTORS, undefined, optional);
  const toolbar = injector.get(SAAS_TOOLBAR_ACTION_CONTRIBUTORS, undefined, optional);
  const entities = getObjectExtensionEntities(injector, 'Saas');

  function assemble<R>(
    key: string,
    entity: EntityExtensionDto | undefined,
    defaults: {
      props: readonly EntityProp<R>[];
      create: readonly FormProp<R>[];
      edit: readonly FormProp<R>[];
      actions: readonly EntityAction<R>[];
      toolbar: readonly ToolbarAction<readonly R[]>[];
    },
    contributions: {
      props?: EntityPropContributorCallback<R>[] | undefined;
      create?: FormPropContributorCallback<R>[] | undefined;
      edit?: FormPropContributorCallback<R>[] | undefined;
      actions?: EntityActionContributorCallback<R>[] | undefined;
      toolbar?: ToolbarActionContributorCallback<readonly R[]>[] | undefined;
    },
  ) {
    const backend = mapEntitiesToContributors<R>(injector, { [key]: entity }, 'Saas');
    mergeWithDefaultProps(extensions.entityProps, { [key]: defaults.props }, backend.prop, {
      [key]: contributions.props ?? [],
    });
    mergeWithDefaultProps(
      extensions.createFormProps,
      { [key]: defaults.create },
      backend.createForm,
      { [key]: contributions.create ?? [] },
    );
    mergeWithDefaultProps(extensions.editFormProps, { [key]: defaults.edit }, backend.editForm, {
      [key]: contributions.edit ?? [],
    });
    mergeWithDefaultActions(
      extensions.entityActions,
      { [key]: defaults.actions },
      { [key]: contributions.actions ?? [] },
    );
    mergeWithDefaultActions(
      extensions.toolbarActions,
      { [key]: defaults.toolbar },
      { [key]: contributions.toolbar ?? [] },
    );
  }

  assemble<SaasTenantDto>(
    SaasComponents.Tenants,
    entities.Tenant,
    {
      props: tenants.DEFAULT_TENANTS_ENTITY_PROPS,
      create: tenants.DEFAULT_TENANTS_CREATE_FORM_PROPS,
      edit: tenants.DEFAULT_TENANTS_EDIT_FORM_PROPS,
      actions: tenants.DEFAULT_TENANTS_ENTITY_ACTIONS,
      toolbar: tenants.DEFAULT_TENANTS_TOOLBAR_ACTIONS,
    },
    {
      props: props?.[SaasComponents.Tenants],
      create: create?.[SaasComponents.Tenants],
      edit: edit?.[SaasComponents.Tenants],
      actions: actions?.[SaasComponents.Tenants],
      toolbar: toolbar?.[SaasComponents.Tenants],
    },
  );
  assemble<EditionDto>(
    SaasComponents.Editions,
    entities.Edition,
    {
      props: editions.DEFAULT_EDITIONS_ENTITY_PROPS,
      create: editions.DEFAULT_EDITIONS_FORM_PROPS,
      edit: editions.DEFAULT_EDITIONS_FORM_PROPS,
      actions: editions.DEFAULT_EDITIONS_ENTITY_ACTIONS,
      toolbar: editions.DEFAULT_EDITIONS_TOOLBAR_ACTIONS,
    },
    {
      props: props?.[SaasComponents.Editions],
      create: create?.[SaasComponents.Editions],
      edit: edit?.[SaasComponents.Editions],
      actions: actions?.[SaasComponents.Editions],
      toolbar: toolbar?.[SaasComponents.Editions],
    },
  );
}
