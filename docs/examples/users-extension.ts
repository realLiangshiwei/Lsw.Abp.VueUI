import { EntityProp, PropType, EntityAction } from '@lsw-abpvue/components';
import { LocalizationService } from '@lsw-abpvue/core';
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { ToasterService } from '@lsw-abpvue/theme-shared';

export const identityOptions = {
  entityPropContributors: {
    [IdentityComponents.Users]: [
      props =>
        props.addTail(
          EntityProp.create<IdentityUserDto>({
            name: 'displayLabel',
            type: PropType.String,
            displayName: 'AbpIdentity::DisplayName:Name',
            valueResolver: data => data.record.name || data.record.userName || '',
          }),
        ),
    ],
  },
  entityActionContributors: {
    [IdentityComponents.Users]: [
      actions =>
        actions.addTail(
          EntityAction.create<IdentityUserDto>({
            text: 'AbpIdentity::UserName',
            action: data => {
              const localization = data.getInjected(LocalizationService);
              data.getInjected(ToasterService).info(
                {
                  key: 'BookStore::SelectedUser',
                  defaultValue: data.record.userName || '',
                },
                localization.t('AbpIdentity::Users'),
              );
            },
          }),
        ),
    ],
  },
} satisfies IdentityConfigOptions;
