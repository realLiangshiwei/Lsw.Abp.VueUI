import { FormProp, PropType, type FormPropContributorCallback } from '@lsw-abpvue/components';
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';

const socialSecurityField: FormPropContributorCallback<IdentityUserDto> = props => {
  props.dropByValueAll(prop => prop.name === 'SocialSecurityNumber');
  props.addAfter(
    FormProp.create<IdentityUserDto>({
      name: 'SocialSecurityNumber',
      type: PropType.String,
      displayName: 'BookStore::SocialSecurityNumber',
      isExtra: true,
      defaultValue: '',
      validators: () => [Validators.required(), Validators.minLength(4), Validators.maxLength(64)],
    }),
    prop => prop.name === 'surname',
  );
};

export const userFormFields = {
  createFormPropContributors: { [IdentityComponents.Users]: [socialSecurityField] },
  editFormPropContributors: { [IdentityComponents.Users]: [socialSecurityField] },
} satisfies IdentityConfigOptions;
