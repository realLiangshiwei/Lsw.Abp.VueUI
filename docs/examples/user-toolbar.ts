import { ToolbarAction } from '@lsw-abpvue/components';
import { LocalizationService } from '@lsw-abpvue/core';
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { ToasterService } from '@lsw-abpvue/theme-shared';

export const userToolbar = {
  toolbarActionContributors: {
    [IdentityComponents.Users]: [
      actions =>
        actions.addTail(
          ToolbarAction.create<readonly IdentityUserDto[]>({
            text: 'BookStore::CurrentPageCount',
            icon: 'bi bi-list-ol',
            permission: 'AbpIdentity.Users',
            action: data =>
              data.getInjected(ToasterService).info(
                data.getInjected(LocalizationService).t(
                  {
                    key: 'BookStore::CurrentPageCountMessage',
                    defaultValue: '{0} users on this page',
                  },
                  String(data.record.length),
                ),
              ),
          }),
        ),
    ],
  },
} satisfies IdentityConfigOptions;
