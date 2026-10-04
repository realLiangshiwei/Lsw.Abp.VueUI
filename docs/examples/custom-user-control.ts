import { FormProp, PropType, type FormPropContributorCallback } from '@lsw-abpvue/components';
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { Validators } from '@lsw-abpvue/theme-shared';
import CustomCodeInput from './CustomCodeInput.vue';

const codeField: FormPropContributorCallback<IdentityUserDto> = props => {
  props.dropByValueAll(prop => prop.name === 'EmployeeCode');
  props.addTail(
    FormProp.create<IdentityUserDto>({
      name: 'EmployeeCode',
      type: PropType.String,
      isExtra: true,
      displayName: 'BookStore::EmployeeCode',
      component: CustomCodeInput,
      validators: () => [Validators.maxLength(16), Validators.pattern(/[A-Z0-9-]*/)],
    }),
  );
};
export const customUserControl = {
  createFormPropContributors: { [IdentityComponents.Users]: [codeField] },
  editFormPropContributors: { [IdentityComponents.Users]: [codeField] },
} satisfies IdentityConfigOptions;
