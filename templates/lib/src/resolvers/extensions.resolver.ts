import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
} from '@lsw-abpvue/components';
import { getCurrentInjector } from '@lsw-abpvue/core';
import {
  DEFAULT_SAMPLE_ENTITY_ACTIONS,
  DEFAULT_SAMPLE_ENTITY_PROPS,
  DEFAULT_SAMPLE_FORM_PROPS,
  DEFAULT_SAMPLE_TOOLBAR_ACTIONS,
} from '../defaults/sample.js';
import { SampleComponents } from '../enums/components.js';
import type { SampleDto } from '../models/sample.js';
import {
  SAMPLE_CREATE_FORM_PROP_CONTRIBUTORS,
  SAMPLE_EDIT_FORM_PROP_CONTRIBUTORS,
  SAMPLE_ENTITY_ACTION_CONTRIBUTORS,
  SAMPLE_ENTITY_PROP_CONTRIBUTORS,
  SAMPLE_TOOLBAR_ACTION_CONTRIBUTORS,
  type SampleEntityActionContributors,
  type SampleEntityPropContributors,
  type SampleFormPropContributors,
  type SampleToolbarActionContributors,
} from '../tokens/extensions.token.js';

/**
 * Assembles the five extension points before the page is allowed to render, in the order
 * that decides priority: this module's defaults, then what the backend's object
 * extensions add, then what the application contributed.
 *
 * Running it again is harmless: a repeated navigation replaces the contributors rather
 * than adding a second copy of every column.
 */
export function sampleExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const extensions = injector.get(ExtensionsService);
  const optional = { optional: true } as const;
  const key = SampleComponents.Sample;

  // The module name is the one the backend's `objectExtensions` uses; an extension
  // property declared there becomes a column and a field with no code here.
  const entities = getObjectExtensionEntities(injector, 'Sample');

  const fromBackend = mapEntitiesToContributors<SampleDto>(
    injector,
    { [key]: entities.Sample },
    'Sample',
  );

  const entityProps: SampleEntityPropContributors =
    injector.get(SAMPLE_ENTITY_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const createFormProps: SampleFormPropContributors =
    injector.get(SAMPLE_CREATE_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const editFormProps: SampleFormPropContributors =
    injector.get(SAMPLE_EDIT_FORM_PROP_CONTRIBUTORS, {}, optional) ?? {};
  const entityActions: SampleEntityActionContributors =
    injector.get(SAMPLE_ENTITY_ACTION_CONTRIBUTORS, {}, optional) ?? {};
  const toolbarActions: SampleToolbarActionContributors =
    injector.get(SAMPLE_TOOLBAR_ACTION_CONTRIBUTORS, {}, optional) ?? {};

  mergeWithDefaultProps(
    extensions.entityProps,
    { [key]: DEFAULT_SAMPLE_ENTITY_PROPS },
    fromBackend.prop,
    { [key]: entityProps[key] ?? [] },
  );

  mergeWithDefaultProps(
    extensions.createFormProps,
    { [key]: DEFAULT_SAMPLE_FORM_PROPS },
    fromBackend.createForm,
    { [key]: createFormProps[key] ?? [] },
  );

  mergeWithDefaultProps(
    extensions.editFormProps,
    { [key]: DEFAULT_SAMPLE_FORM_PROPS },
    fromBackend.editForm,
    { [key]: editFormProps[key] ?? [] },
  );

  mergeWithDefaultActions(
    extensions.entityActions,
    { [key]: DEFAULT_SAMPLE_ENTITY_ACTIONS },
    { [key]: entityActions[key] ?? [] },
  );

  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [key]: DEFAULT_SAMPLE_TOOLBAR_ACTIONS },
    { [key]: toolbarActions[key] ?? [] },
  );
}
