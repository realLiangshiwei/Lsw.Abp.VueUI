import type { ProviderInput } from '@lsw-abpvue/core';
import type { AccountConfigOptions } from '../models/config-options.js';
import { TwoFactorService } from '../services/two-factor.service.js';
import {
  ACCOUNT_APP_NAME,
  ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS,
  ACCOUNT_RE_LOGIN_CONFIRMATION,
  ACCOUNT_REDIRECT_URL,
} from '../tokens/config-options.token.js';

/**
 * The module's providers. They go on the route record, so they cover the module's own
 * pages and nothing else.
 * @param options What the host configured and contributed
 */
export function provideAccount(options: AccountConfigOptions = {}): ProviderInput[] {
  return [
    ...(options.twoFactorService
      ? [{ provide: TwoFactorService, useValue: options.twoFactorService }]
      : []),
    { provide: ACCOUNT_REDIRECT_URL, useValue: options.redirectUrl ?? '/' },
    { provide: ACCOUNT_APP_NAME, useValue: options.appName ?? 'Vue' },
    {
      provide: ACCOUNT_RE_LOGIN_CONFIRMATION,
      useValue: options.isPersonalSettingsChangedConfirmationActive ?? true,
    },
    {
      provide: ACCOUNT_EDIT_FORM_PROP_CONTRIBUTORS,
      useValue: options.editFormPropContributors ?? {},
    },
  ];
}
