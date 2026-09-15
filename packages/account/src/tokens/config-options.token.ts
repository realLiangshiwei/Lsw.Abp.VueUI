import { defineToken } from '@lsw-abpvue/core';
import type { AccountFormPropContributors } from '../models/config-options.js';

/** Where a login goes when the route carried no `returnUrl`. */
export const ACCOUNT_REDIRECT_URL = defineToken<string>('ACCOUNT_REDIRECT_URL', {
  factory: () => '/',
});

/** The application name ABP builds a password reset link for. */
export const ACCOUNT_APP_NAME = defineToken<string>('ACCOUNT_APP_NAME', { factory: () => 'Vue' });

/** Whether changing a session field offers to sign in again. */
export const ACCOUNT_RE_LOGIN_CONFIRMATION = defineToken<boolean>('ACCOUNT_RE_LOGIN_CONFIRMATION', {
  factory: () => true,
});

export const ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS = defineToken<AccountFormPropContributors>(
  'ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS',
);
