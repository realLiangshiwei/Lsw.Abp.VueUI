import {
  AuthService,
  ConfigStateService,
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
} from '@lsw-abpvue/core';
import type { EnvironmentProviders } from '@lsw-abpvue/core';
import { UserMenuService } from '@lsw-abpvue/theme-shared';
import type { AccountProOptions } from '../models/options.js';
import { ACCOUNT_PRO_OPTIONS } from '../tokens/options.token.js';
export function provideAccountProConfig(options: AccountProOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ACCOUNT_PRO_OPTIONS, useValue: options },
    provideAppInitializer(() => {
      const config = inject(ConfigStateService);
      const auth = inject(AuthService);
      const menu = inject(UserMenuService);
      inject(RoutesService).add([
        {
          name: 'Account.Workflows',
          breadcrumbText: 'AbpAccount::LinkedAccounts',
          path: '/account/workflows',
          layout: LayoutType.application,
          invisible: true,
        },
      ]);
      menu.add([
        {
          name: 'Account.LinkedAccounts',
          order: 80,
          text: 'AbpAccount::LinkedAccounts',
          path: '/account/workflows?section=links',
          visible: () => auth.isAuthenticated.value,
        },
        {
          name: 'Account.AuthorityDelegation',
          order: 81,
          text: 'AbpIdentity::AuthorityDelegation',
          path: '/account/workflows?section=delegation',
          visible: () => auth.isAuthenticated.value,
        },
        {
          name: 'Account.MyTenants',
          order: 82,
          text: 'AbpAccount::SwitchTenant',
          path: '/account/workflows?section=tenants',
          visible: () =>
            auth.isAuthenticated.value && config.snapshot().multiTenancy.userSharingStrategy === 1,
        },
        {
          name: 'CommercialUi.BackToImpersonationNavItem',
          order: 79,
          text: 'AbpAccount::BackToImpersonator',
          path: '/account/workflows?section=return',
          visible: () =>
            Boolean(
              config.snapshot().currentUser.impersonatorUserId ||
              config.snapshot().currentUser.impersonatorTenantId,
            ),
        },
      ]);
    }),
  ]);
}
