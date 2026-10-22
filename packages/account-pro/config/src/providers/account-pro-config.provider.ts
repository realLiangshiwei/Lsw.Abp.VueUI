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
import { provideAccountConfig } from '@lsw-abpvue/account/config';
import type { AccountProOptions } from '../models/options.js';
import { ACCOUNT_PRO_OPTIONS } from '../tokens/options.token.js';
import { configureAccountProProfileTabs } from '../services/profile-tabs.js';
import { AccountProRouteNames } from '../enums/route-names.js';
export function provideAccountProConfig(options: AccountProOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAccountConfig(),
    { provide: ACCOUNT_PRO_OPTIONS, useValue: options },
    provideAppInitializer(configureAccountProProfileTabs),
    provideAppInitializer(() => {
      const config = inject(ConfigStateService);
      const auth = inject(AuthService);
      const menu = inject(UserMenuService);
      const routes = inject(RoutesService);
      routes.patch(AccountProRouteNames.Account, { path: '/account' });
      routes.add([
        ...(
          [
            [AccountProRouteNames.LoginWithRecoveryCode, 'login-with-recovery-code'],
            [AccountProRouteNames.EmailConfirmation, 'email-confirmation'],
            [AccountProRouteNames.LinkLogged, 'link-logged'],
            [AccountProRouteNames.SendSecurityCode, 'send-security-code'],
            [AccountProRouteNames.MySecurityLogs, 'security-logs'],
            [AccountProRouteNames.Sessions, 'sessions'],
            [AccountProRouteNames.ConfirmUser, 'confirm-user'],
            [AccountProRouteNames.Invite, 'invite'],
          ] as const
        ).map(([name, path]) => ({
          name,
          path: `/account/${path}`,
          parentName: AccountProRouteNames.Account,
          layout:
            path === 'security-logs' || path === 'sessions'
              ? LayoutType.application
              : LayoutType.account,
          breadcrumbText: name,
        })),
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
          name: 'Account.MySecurityLogs',
          order: 83,
          text: 'AbpAccount::MySecurityLogs',
          get path() {
            return routes.search({ name: AccountProRouteNames.MySecurityLogs })?.path;
          },
          visible: () => auth.isAuthenticated.value,
        },
        {
          name: 'Account.Sessions',
          order: 84,
          text: 'AbpIdentity::Sessions',
          get path() {
            return routes.search({ name: AccountProRouteNames.Sessions })?.path;
          },
          visible: () => auth.isAuthenticated.value,
        },
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
