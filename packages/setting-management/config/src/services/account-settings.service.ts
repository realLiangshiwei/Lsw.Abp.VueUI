import { ConfigStateService, defineToken, inject } from '@lsw-abpvue/core';

export interface AccountSettings {
  isSelfRegistrationEnabled: boolean;
  enableLocalLogin: boolean;
}

/** Reads account settings and optionally saves them through the host's account module. */
export interface AccountSettingsService {
  requiredPolicy?: string | undefined;
  get(): Promise<AccountSettings>;
  update?(settings: AccountSettings): Promise<void>;
}

export const AccountSettingsService = defineToken<AccountSettingsService>(
  'AccountSettingsService',
  {
    factory: () => {
      const config = inject(ConfigStateService);
      return {
        get: () => {
          const values = config.snapshot().setting.values;
          return Promise.resolve({
            isSelfRegistrationEnabled: values['Abp.Account.IsSelfRegistrationEnabled'] === 'true',
            enableLocalLogin: values['Abp.Account.EnableLocalLogin'] === 'true',
          });
        },
      };
    },
  },
);
