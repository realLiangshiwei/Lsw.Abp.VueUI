import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type PropData,
} from '@lsw-abpvue/components';
import { LanguageManagementPolicyNames as Policy } from '@lsw-abpvue/language-management/config';
import type { LanguageDto, LanguageTextDto } from '@lsw-abpvue/language-management/proxy';
import { LocalizationService } from '@lsw-abpvue/core';
import { Validators } from '@lsw-abpvue/theme-shared';
import { computed, markRaw } from 'vue';
import LanguageDisplayName from '../components/LanguageDisplayName.vue';
import { LanguageManagementComponents as Keys } from '../enums/components.js';
import { LANGUAGES_PAGE, LANGUAGE_TEXTS_PAGE } from '../tokens/pages.token.js';

export const DEFAULT_LANGUAGES_ENTITY_PROPS = EntityProp.createMany<LanguageDto>([
  {
    name: 'displayName',
    displayName: 'LanguageManagement::DisplayName',
    type: PropType.String,
    columnWidth: 200,
    sortable: true,
    component: markRaw(LanguageDisplayName),
  },
  {
    name: 'cultureName',
    displayName: 'LanguageManagement::CultureName',
    type: PropType.String,
    columnWidth: 200,
    sortable: true,
  },
  {
    name: 'uiCultureName',
    displayName: 'LanguageManagement::UiCultureName',
    type: PropType.String,
    columnWidth: 200,
    sortable: true,
  },
  {
    name: 'isEnabled',
    displayName: 'LanguageManagement::IsEnabled',
    type: PropType.Boolean,
    columnWidth: 100,
    sortable: true,
  },
]);

export const DEFAULT_LANGUAGES_CREATE_FORM_PROPS = FormProp.createMany<LanguageDto>([
  ...(['cultureName', 'uiCultureName'] as const).map(name => ({
    name,
    displayName:
      name === 'cultureName'
        ? 'LanguageManagement::CultureName'
        : 'LanguageManagement::UiCultureName',
    type: PropType.Enum,
    id: name === 'cultureName' ? 'culture-name' : 'ui-culture-name',
    validators: () => [Validators.required()],
    options: (data: PropData<LanguageDto>) => {
      const page = data.getInjected(LANGUAGES_PAGE);
      const localization = data.getInjected(LocalizationService);
      return computed(() => [
        { label: localization.t('AbpUi::NotAssigned'), value: null },
        ...page.cultures.value.map(culture => ({
          label: culture.displayName ?? culture.name ?? '',
          value: culture.name || null,
        })),
      ]);
    },
  })),
  {
    name: 'displayName',
    displayName: 'LanguageManagement::DisplayName',
    type: PropType.String,
    id: 'name',
    validators: () => [Validators.maxLength(32)],
  },
  {
    name: 'isEnabled',
    displayName: 'LanguageManagement::IsEnabled',
    type: PropType.Boolean,
    id: 'is-enabled',
    defaultValue: false,
  },
]);
export const DEFAULT_LANGUAGES_EDIT_FORM_PROPS = DEFAULT_LANGUAGES_CREATE_FORM_PROPS.slice(2);

export const DEFAULT_LANGUAGES_ENTITY_ACTIONS = EntityAction.createMany<LanguageDto>([
  {
    text: 'LanguageManagement::Edit',
    icon: 'bi bi-pencil',
    permission: Policy.LanguagesEdit,
    action: data => data.getInjected(LANGUAGES_PAGE).edit(data.record),
  },
  {
    text: 'LanguageManagement::Delete',
    icon: 'bi bi-trash',
    permission: Policy.LanguagesDelete,
    action: data => data.getInjected(LANGUAGES_PAGE).remove(data.record),
  },
  {
    text: 'LanguageManagement::SetAsDefaultLanguage',
    permission: Policy.LanguagesChangeDefault,
    action: data => data.getInjected(LANGUAGES_PAGE).setAsDefault(data.record),
  },
]);
export const DEFAULT_LANGUAGES_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly LanguageDto[]>([
  {
    text: 'LanguageManagement::CreateNewLanguage',
    icon: 'bi bi-plus',
    permission: Policy.LanguagesCreate,
    action: data => data.getInjected(LANGUAGES_PAGE).add(),
  },
]);
export const DEFAULT_LANGUAGE_TEXTS_ENTITY_ACTIONS = EntityAction.createMany<LanguageTextDto>([
  {
    text: 'LanguageManagement::Edit',
    icon: 'bi bi-pencil',
    permission: Policy.LanguageTextsEdit,
    action: data => data.getInjected(LANGUAGE_TEXTS_PAGE).edit(data.record),
  },
]);
export const DEFAULT_LANGUAGE_TEXTS_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly LanguageTextDto[]
>([]);
export const DEFAULT_LANGUAGE_TEXTS_ENTITY_PROPS = EntityProp.createMany<LanguageTextDto>(
  (
    [
      ['name', 'LanguageManagement::Key'],
      ['baseValue', 'LanguageManagement::BaseValue'],
      ['value', 'LanguageManagement::Value'],
      ['resourceName', 'LanguageManagement::ResourceName'],
    ] as const
  ).map(([name, displayName]) => ({
    name,
    displayName,
    type: PropType.String,
    columnWidth: 200,
    sortable: true,
  })),
);

export const DEFAULT_LANGUAGE_MANAGEMENT_ENTITY_ACTIONS = {
  [Keys.Languages]: DEFAULT_LANGUAGES_ENTITY_ACTIONS,
  [Keys.LanguageTexts]: DEFAULT_LANGUAGE_TEXTS_ENTITY_ACTIONS,
};
export const DEFAULT_LANGUAGE_MANAGEMENT_TOOLBAR_ACTIONS = {
  [Keys.Languages]: DEFAULT_LANGUAGES_TOOLBAR_ACTIONS,
  [Keys.LanguageTexts]: DEFAULT_LANGUAGE_TEXTS_TOOLBAR_ACTIONS,
};
export const DEFAULT_LANGUAGE_MANAGEMENT_ENTITY_PROPS = {
  [Keys.Languages]: DEFAULT_LANGUAGES_ENTITY_PROPS,
  [Keys.LanguageTexts]: DEFAULT_LANGUAGE_TEXTS_ENTITY_PROPS,
};
export const DEFAULT_LANGUAGE_MANAGEMENT_CREATE_FORM_PROPS = {
  [Keys.Languages]: DEFAULT_LANGUAGES_CREATE_FORM_PROPS,
};
export const DEFAULT_LANGUAGE_MANAGEMENT_EDIT_FORM_PROPS = {
  [Keys.Languages]: DEFAULT_LANGUAGES_EDIT_FORM_PROPS,
};
