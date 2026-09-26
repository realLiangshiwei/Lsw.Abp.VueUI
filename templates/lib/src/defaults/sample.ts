import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
} from '@lsw-abpvue/components';
import { Validators } from '@lsw-abpvue/theme-shared';
import { SamplePolicyNames } from '@lsw-abpvue/template-lib/config';
import type { SampleDto } from '../models/sample.js';
import { SAMPLE_PAGE } from '../tokens/extensions.token.js';

/** The columns this module puts on its page; a host adds to them through a contributor. */
export const DEFAULT_SAMPLE_ENTITY_PROPS = EntityProp.createMany<SampleDto>([
  { type: PropType.String, name: 'name', displayName: 'Sample::Name', sortable: true },
]);

export const DEFAULT_SAMPLE_FORM_PROPS = FormProp.createMany<SampleDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'Sample::Name',
    validators: () => [Validators.required(), Validators.maxLength(128)],
  },
]);

export const DEFAULT_SAMPLE_ENTITY_ACTIONS = EntityAction.createMany<SampleDto>([
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: SamplePolicyNames.SampleUpdate,
    action: data => data.getInjected(SAMPLE_PAGE).edit(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: SamplePolicyNames.SampleDelete,
    action: data => void data.getInjected(SAMPLE_PAGE).remove(data.record),
  },
]);

export const DEFAULT_SAMPLE_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly SampleDto[]>([
  {
    text: 'AbpUi::NewRecord',
    icon: 'bi bi-plus',
    permission: SamplePolicyNames.SampleCreate,
    action: data => data.getInjected(SAMPLE_PAGE).add(),
  },
]);
