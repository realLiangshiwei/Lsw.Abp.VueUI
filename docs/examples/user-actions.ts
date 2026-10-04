import { EntityAction } from '@lsw-abpvue/components';
import { IdentityComponents, USERS_PAGE, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';

export const userActions = {
  entityActionContributors: {
    [IdentityComponents.Users]: [
      actions => {
        actions.dropByValue(action => action.text === 'AbpUi::Edit');
        actions.addHead(
          EntityAction.create<IdentityUserDto>({
            text: 'AbpUi::Edit',
            icon: 'bi bi-pencil',
            permission: 'AbpIdentity.Users.Update',
            visible: data => data?.record.isActive === true,
            action: data => data.getInjected(USERS_PAGE).edit(data.record),
          }),
        );
      },
    ],
  },
} satisfies IdentityConfigOptions;
