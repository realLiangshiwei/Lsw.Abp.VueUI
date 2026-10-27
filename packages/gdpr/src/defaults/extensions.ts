import { EntityProp, PropType, ToolbarAction, type PropData } from '@lsw-abpvue/components';
import { LocalizationService } from '@lsw-abpvue/core';
import type { GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import { computed, markRaw } from 'vue';
import AbpGdprActionColumn from '../components/AbpGdprActionColumn.vue';
import AbpRequestPersonalDataToolbarAction from '../components/AbpRequestPersonalDataToolbarAction.vue';
import { GdprComponents } from '../enums/components.js';
import { GDPR_PAGE } from '../tokens/page.token.js';

function dateText(value: string, data: PropData<GdprRequestDto>) {
  const localization = data.getInjected(LocalizationService);
  return computed(() => {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(localization.currentLang.value || undefined, {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(date)
      : '';
  });
}

export const DEFAULT_PERSONAL_DATA_ENTITY_PROPS = EntityProp.createMany<GdprRequestDto>([
  {
    name: 'action',
    displayName: 'AbpGdpr::Action',
    type: PropType.String,
    sortable: true,
    columnWidth: 180,
    component: markRaw(AbpGdprActionColumn),
  },
  {
    name: 'creationTime',
    displayName: 'AbpGdpr::CreationTime',
    type: PropType.DateTime,
    sortable: true,
    columnWidth: 200,
    valueResolver: data => dateText(data.record.creationTime, data),
  },
  {
    name: 'readyTime',
    displayName: 'AbpGdpr::ReadyTime',
    type: PropType.DateTime,
    sortable: true,
    columnWidth: 200,
    valueResolver: data => dateText(data.record.readyTime, data),
  },
]);

export const DEFAULT_PERSONAL_DATA_TOOLBAR_ACTIONS = ToolbarAction.createMany<
  readonly GdprRequestDto[]
>([
  {
    text: 'AbpGdpr::RequestPersonalData',
    component: markRaw(AbpRequestPersonalDataToolbarAction),
    action: data => data.getInjected(GDPR_PAGE).requestPersonalDate(),
  },
  {
    text: 'AbpGdpr::DeletePersonalData',
    btnClass: 'btn-danger',
    action: data => data.getInjected(GDPR_PAGE).deleteData(),
  },
]);

export const DEFAULT_GDPR_ENTITY_PROPS_VALUE = {
  [GdprComponents.PersonalData]: DEFAULT_PERSONAL_DATA_ENTITY_PROPS,
};
export const DEFAULT_GDPR_TOOLBAR_ACTIONS_VALUE = {
  [GdprComponents.PersonalData]: DEFAULT_PERSONAL_DATA_TOOLBAR_ACTIONS,
};
