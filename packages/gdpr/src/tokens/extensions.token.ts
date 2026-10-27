import type {
  EntityPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import type { GdprComponents } from '../enums/components.js';

export type GdprEntityPropContributors = {
  [GdprComponents.PersonalData]?: EntityPropContributorCallback<GdprRequestDto>[] | undefined;
};
export type GdprToolbarActionContributors = {
  [GdprComponents.PersonalData]?:
    ToolbarActionContributorCallback<readonly GdprRequestDto[]>[] | undefined;
};

export interface GdprConfigOptions {
  createFormPropContributors?: GdprEntityPropContributors | undefined;
  toolbarActionContributors?: GdprToolbarActionContributors | undefined;
}

export const DEFAULT_GDPR_ENTITY_PROPS = defineToken<GdprEntityPropContributors>(
  'DEFAULT_GDPR_ENTITY_PROPS',
);
export const DEFAULT_GDPR_TOOLBAR_ACTIONS = defineToken<GdprToolbarActionContributors>(
  'DEFAULT_GDPR_TOOLBAR_ACTIONS',
);
