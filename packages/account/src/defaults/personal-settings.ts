import { FormProp, PropType, type FormPropOptions } from '@lsw-abpvue/components';
import type { ProfileDto } from '@lsw-abpvue/account-core/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';

const FIELDS: FormPropOptions<ProfileDto>[] = [
  {
    type: PropType.String,
    name: 'userName',
    displayName: 'AbpIdentity::DisplayName:UserName',
    id: 'username',
    validators: () => [Validators.required(), Validators.maxLength(256)],
  },
  {
    type: PropType.String,
    name: 'name',
    displayName: 'AbpIdentity::DisplayName:Name',
    id: 'name',
    validators: () => [Validators.maxLength(64)],
  },
  {
    type: PropType.String,
    name: 'surname',
    displayName: 'AbpIdentity::DisplayName:Surname',
    id: 'surname',
    validators: () => [Validators.maxLength(64)],
  },
  {
    type: PropType.Email,
    name: 'email',
    displayName: 'AbpIdentity::DisplayName:Email',
    id: 'email-address',
    validators: () => [Validators.required(), Validators.email(), Validators.maxLength(256)],
  },
  {
    type: PropType.String,
    name: 'phoneNumber',
    displayName: 'AbpIdentity::DisplayName:PhoneNumber',
    id: 'phone-number',
    validators: () => [Validators.maxLength(16)],
  },
];

/** What the module itself puts on the personal settings tab. */
export const DEFAULT_PERSONAL_SETTINGS_FORM_PROPS = FormProp.createMany<ProfileDto>(FIELDS);
