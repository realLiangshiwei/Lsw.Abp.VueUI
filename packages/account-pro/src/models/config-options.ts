import type {
  EntityActionContributorCallback,
  EntityPropContributorCallback,
  FormPropContributorCallback,
  ToolbarActionContributorCallback,
} from '@lsw-abpvue/components';
import type { AccountProOptions } from '@lsw-abpvue/account-pro/config';
import type { IdentitySecurityLogDto, ProfileDto } from '@lsw-abpvue/account-pro/proxy';

export interface AccountProConfigOptions extends AccountProOptions {
  /** @deprecated Profile changes refresh the current session. */
  isPersonalSettingsChangedConfirmationActive?: boolean | undefined;
  personelInfoEntityPropContributors?: AccountProConfigOptions['editFormPropContributors'];
  entityActionContributors?:
    | {
        'Account.MySecurityLogs'?:
          EntityActionContributorCallback<IdentitySecurityLogDto>[] | undefined;
      }
    | undefined;
  entityPropContributors?:
    | {
        'Account.MySecurityLogs'?:
          EntityPropContributorCallback<IdentitySecurityLogDto>[] | undefined;
      }
    | undefined;
  toolbarActionContributors?:
    | {
        'Account.MySecurityLogs'?:
          ToolbarActionContributorCallback<readonly IdentitySecurityLogDto[]>[] | undefined;
      }
    | undefined;
  editFormPropContributors?:
    | {
        'Account.PersonalSettingsComponent'?: FormPropContributorCallback<ProfileDto>[] | undefined;
      }
    | undefined;
}
