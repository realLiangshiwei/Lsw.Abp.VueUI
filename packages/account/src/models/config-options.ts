import type { FormPropContributorCallback } from '@lsw-abpvue/components';
import type { ProfileDto } from '@lsw-abpvue/account-core/proxy';
import type { AccountComponents } from '@lsw-abpvue/account-core';

/** What a host may contribute to the personal settings form, keyed by component key. */
export type AccountFormPropContributors = Partial<{
  [AccountComponents.PersonalSettings]: FormPropContributorCallback<ProfileDto>[];
}>;

/** Named as `@abp/ng.account` names it, so a migrated configuration reads the same. */
export interface AccountConfigOptions {
  /**
   * Where a successful login goes when the route carried no `returnUrl`.
   * @default '/'
   */
  redirectUrl?: string | undefined;
  /**
   * Which application ABP should build the password reset link for. It has to be a name
   * the backend registered in `AppUrlOptions.Applications`; ABP's own Angular UI sends
   * `Angular`, and a backend that has never heard of the name cannot send the mail.
   * @default 'Vue'
   */
  appName?: string | undefined;
  /**
   * Whether changing something that is part of the session -- the user name, the email
   * address -- offers to sign in again.
   * @default true
   */
  isPersonalSettingsChangedConfirmationActive?: boolean | undefined;
  editFormPropContributors?: AccountFormPropContributors | undefined;
}
