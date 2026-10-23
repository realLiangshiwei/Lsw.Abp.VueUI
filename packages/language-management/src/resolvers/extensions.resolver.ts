import {
  ExtensionsService,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  type FormProp,
} from '@lsw-abpvue/components';
import { inject, getCurrentInjector } from '@lsw-abpvue/core';
import type { LanguageDto, LanguageTextDto } from '@lsw-abpvue/language-management/proxy';
import * as defaults from '../defaults/extensions.js';
import { LanguageManagementComponents as Keys } from '../enums/components.js';
import {
  LANGUAGE_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS,
  LANGUAGE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS,
} from '../tokens/extensions.token.js';

/** Assembles defaults, object extensions and application contributions, in that order. */
export function languageManagementExtensionsResolver(): void {
  const injector = getCurrentInjector();
  if (!injector) return;
  const extensions = inject(ExtensionsService);
  const optional = { optional: true } as const;
  const actions = inject(LANGUAGE_MANAGEMENT_ENTITY_ACTION_CONTRIBUTORS, optional) ?? {};
  const props = inject(LANGUAGE_MANAGEMENT_ENTITY_PROP_CONTRIBUTORS, optional) ?? {};
  const toolbar = inject(LANGUAGE_MANAGEMENT_TOOLBAR_ACTION_CONTRIBUTORS, optional) ?? {};
  const create = inject(LANGUAGE_MANAGEMENT_CREATE_FORM_PROP_CONTRIBUTORS, optional) ?? {};
  const edit = inject(LANGUAGE_MANAGEMENT_EDIT_FORM_PROP_CONTRIBUTORS, optional) ?? {};
  const key = Keys.Languages;
  const textKey = Keys.LanguageTexts;
  const entities = getObjectExtensionEntities(injector, 'LanguageManagement');
  const backend = mapEntitiesToContributors<LanguageDto>(
    injector,
    { [key]: entities.Language },
    'LanguageManagement',
  );

  mergeWithDefaultActions(
    extensions.entityActions,
    { [key]: defaults.DEFAULT_LANGUAGES_ENTITY_ACTIONS },
    { [key]: actions[key] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [key]: defaults.DEFAULT_LANGUAGES_TOOLBAR_ACTIONS },
    { [key]: toolbar[key] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    { [key]: defaults.DEFAULT_LANGUAGES_ENTITY_PROPS },
    backend.prop,
    { [key]: props[key] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.createFormProps,
    { [key]: defaults.DEFAULT_LANGUAGES_CREATE_FORM_PROPS },
    backend.createForm,
    { [key]: create[key] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.editFormProps,
    { [key]: defaults.DEFAULT_LANGUAGES_EDIT_FORM_PROPS },
    backend.editForm,
    { [key]: edit[key] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    { [textKey]: defaults.DEFAULT_LANGUAGE_TEXTS_ENTITY_ACTIONS },
    { [textKey]: actions[textKey] ?? [] },
  );
  mergeWithDefaultActions(
    extensions.toolbarActions,
    { [textKey]: defaults.DEFAULT_LANGUAGE_TEXTS_TOOLBAR_ACTIONS },
    { [textKey]: toolbar[textKey] ?? [] },
  );
  mergeWithDefaultProps(
    extensions.entityProps,
    { [textKey]: defaults.DEFAULT_LANGUAGE_TEXTS_ENTITY_PROPS },
    {},
    { [textKey]: props[textKey] ?? [] },
  );
  mergeWithDefaultProps<FormProp<LanguageTextDto>>(
    extensions.createFormProps,
    { [textKey]: [] },
    {},
    { [textKey]: create[textKey] ?? [] },
  );
  mergeWithDefaultProps<FormProp<LanguageTextDto>>(
    extensions.editFormProps,
    { [textKey]: [] },
    {},
    { [textKey]: edit[textKey] ?? [] },
  );
}
