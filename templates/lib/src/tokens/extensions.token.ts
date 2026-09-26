import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import { defineToken } from '@lsw-abpvue/core';
import type { SampleDto } from '../models/sample.js';
import type { SampleComponents } from '../enums/components.js';

/** The contributors a host may register, keyed by component key. */
export type SampleEntityPropContributors = Partial<{
  [SampleComponents.Sample]: EntityPropContributorCallback<SampleDto>[];
}>;

export type SampleFormPropContributors = Partial<{
  [SampleComponents.Sample]: FormPropContributorCallback<SampleDto>[];
}>;

export type SampleEntityActionContributors = Partial<{
  [SampleComponents.Sample]: EntityActionContributorCallback<SampleDto>[];
}>;

export type SampleToolbarActionContributors = Partial<{
  [SampleComponents.Sample]: ToolbarActionContributorCallback<readonly SampleDto[]>[];
}>;

export const SAMPLE_ENTITY_PROP_CONTRIBUTORS = defineToken<SampleEntityPropContributors>(
  'SAMPLE_ENTITY_PROP_CONTRIBUTORS',
);

export const SAMPLE_CREATE_FORM_PROP_CONTRIBUTORS = defineToken<SampleFormPropContributors>(
  'SAMPLE_CREATE_FORM_PROP_CONTRIBUTORS',
);

export const SAMPLE_EDIT_FORM_PROP_CONTRIBUTORS = defineToken<SampleFormPropContributors>(
  'SAMPLE_EDIT_FORM_PROP_CONTRIBUTORS',
);

export const SAMPLE_ENTITY_ACTION_CONTRIBUTORS = defineToken<SampleEntityActionContributors>(
  'SAMPLE_ENTITY_ACTION_CONTRIBUTORS',
);

export const SAMPLE_TOOLBAR_ACTION_CONTRIBUTORS = defineToken<SampleToolbarActionContributors>(
  'SAMPLE_TOOLBAR_ACTION_CONTRIBUTORS',
);

/** What the page offers its row and toolbar buttons. */
export interface SamplePageCommands {
  add(): void;
  edit(record: SampleDto): void;
  remove(record: SampleDto): Promise<void>;
}

export const SAMPLE_PAGE = defineToken<SamplePageCommands>('SAMPLE_PAGE');
