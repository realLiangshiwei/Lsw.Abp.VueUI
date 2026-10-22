import { ProfileService as CoreProfileService } from '@lsw-abpvue/account-core/proxy';
import {
  ACCOUNT_PRO_OPTIONS,
  AccountProProfileStateService,
  configureAccountProProfileTabs,
} from '@lsw-abpvue/account-pro/config';
import { ProfileService } from '@lsw-abpvue/account-pro/proxy';
import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import type { AccountProConfigOptions } from '../models/config-options.js';
import { ACCOUNT_PRO_CONFIG_OPTIONS } from '../tokens/config-options.token.js';

/** Registers Public Account Pro defaults and typed application contributions. */
export function provideAccountPro(options?: AccountProConfigOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...(options ? [{ provide: ACCOUNT_PRO_CONFIG_OPTIONS, useValue: options }] : []),
    {
      provide: CoreProfileService,
      useFactory: () => {
        const service = inject(ProfileService);
        const state = inject(AccountProProfileStateService);
        const common = inject(ACCOUNT_PRO_OPTIONS);
        const configured = inject(ACCOUNT_PRO_CONFIG_OPTIONS);
        return {
          ...service,
          changePassword: async (...args: Parameters<CoreProfileService['changePassword']>) => {
            const profile = state.profile.value;
            await service.changePassword(...args);
            if (profile && state.profile.value === profile)
              state.set({ ...profile, hasPassword: true }, state.canEnableTwoFactor.value);
          },
          update: (body: Parameters<CoreProfileService['update']>[0]) =>
            service.update({
              ...body,
              userName: body.userName ?? '',
              appName: configured.appName ?? common.appName ?? 'Vue',
            }),
        };
      },
    },
    provideAppInitializer(configureAccountProProfileTabs),
  ]);
}
