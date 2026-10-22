import {
  EntityAction,
  EntityProp,
  FormProp,
  PropType,
  ToolbarAction,
  type FormPropOptions,
} from '@lsw-abpvue/components';
import type { ClaimTypeDto } from '@lsw-abpvue/identity-pro/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';
import { IDENTITY_PRO_CLAIMS_PAGE } from '../tokens/claims-page.token.js';

export const DEFAULT_CLAIMS_ENTITY_PROPS = EntityProp.createMany<ClaimTypeDto>([
  {
    name: 'name',
    displayName: 'AbpIdentity::Name',
    type: PropType.String,
    sortable: true,
    columnWidth: 250,
  },
  {
    name: 'valueType',
    displayName: 'AbpIdentity::ValueType',
    type: PropType.String,
    sortable: true,
    columnWidth: 200,
    valueResolver: data =>
      ['String', 'Int', 'Boolean', 'DateTime'][data.record.valueType] ??
      String(data.record.valueType),
  },
  {
    name: 'description',
    displayName: 'AbpIdentity::Description',
    type: PropType.String,
    sortable: true,
    columnWidth: 250,
  },
  {
    name: 'regex',
    displayName: 'AbpIdentity::Regex',
    type: PropType.String,
    sortable: true,
    columnWidth: 200,
  },
  {
    name: 'required',
    displayName: 'AbpIdentity::Required',
    type: PropType.Boolean,
    sortable: true,
    columnWidth: 150,
  },
  {
    name: 'isStatic',
    displayName: 'AbpIdentity::IsStatic',
    type: PropType.Boolean,
    sortable: true,
    columnWidth: 150,
  },
]);

const fields: FormPropOptions<ClaimTypeDto>[] = [
  {
    name: 'name',
    displayName: 'AbpIdentity::Name',
    type: PropType.String,
    id: 'name',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    name: 'required',
    displayName: 'AbpIdentity::Required',
    type: PropType.Boolean,
    id: 'required',
    defaultValue: false,
  },
  { name: 'regex', displayName: 'AbpIdentity::Regex', type: PropType.String, id: 'regex' },
  {
    name: 'regexDescription',
    displayName: 'AbpIdentity::RegexDescription',
    type: PropType.String,
    id: 'regex-description',
    formText: 'AbpIdentity::RegexDescriptionFormText',
  },
  {
    name: 'description',
    displayName: 'AbpIdentity::Description',
    type: PropType.String,
    id: 'description',
  },
  {
    name: 'valueType',
    displayName: 'AbpIdentity::ValueType',
    type: PropType.Enum,
    id: 'value-type',
    defaultValue: 0,
    options: () => [
      { label: 'String', value: 0 },
      { label: 'Int', value: 1 },
      { label: 'Boolean', value: 2 },
      { label: 'DateTime', value: 3 },
    ],
  },
];

export const DEFAULT_CLAIMS_CREATE_FORM_PROPS = FormProp.createMany<ClaimTypeDto>(fields);
export const DEFAULT_CLAIMS_EDIT_FORM_PROPS = DEFAULT_CLAIMS_CREATE_FORM_PROPS;
export const DEFAULT_CLAIMS_ENTITY_ACTIONS = EntityAction.createMany<ClaimTypeDto>([
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: 'AbpIdentity.ClaimTypes.Update',
    visible: data => data?.record.isStatic !== true,
    action: data => data.getInjected(IDENTITY_PRO_CLAIMS_PAGE).edit(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: 'AbpIdentity.ClaimTypes.Delete',
    action: data => data.getInjected(IDENTITY_PRO_CLAIMS_PAGE).remove(data.record),
  },
]);
export const DEFAULT_CLAIMS_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly ClaimTypeDto[]>([
  {
    text: 'AbpIdentity::NewClaimType',
    icon: 'bi bi-plus',
    permission: 'AbpIdentity.ClaimTypes.Create',
    action: data => data.getInjected(IDENTITY_PRO_CLAIMS_PAGE).add(),
  },
]);
