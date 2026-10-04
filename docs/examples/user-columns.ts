import { EntityProp, PropType } from '@lsw-abpvue/components';
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import ContactCell from './ContactCell.vue';

export const userColumns = {
  entityPropContributors: {
    [IdentityComponents.Users]: [
      props => {
        props.dropByValue(prop => prop.name === 'email');
        props.addAfter(
          EntityProp.create<IdentityUserDto>({
            name: 'contact',
            type: PropType.String,
            displayName: 'AbpIdentity::DisplayName:Email',
            component: ContactCell,
            columnWidth: 240,
          }),
          prop => prop.name === 'userName',
        );
      },
    ],
  },
} satisfies IdentityConfigOptions;
