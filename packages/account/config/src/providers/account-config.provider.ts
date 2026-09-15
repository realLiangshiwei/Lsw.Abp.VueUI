import {
  inject,
  LayoutType,
  makeEnvironmentProviders,
  NAVIGATE_TO_MANAGE_PROFILE,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { ABP_ROUTER } from '@lsw-abpvue/core/router';
import { AccountRouteNames } from '../enums/route-names.js';

/**
 * The module's menu entries, and the profile page as the one the user menu opens.
 * `@lsw-abpvue/oauth` points `NAVIGATE_TO_MANAGE_PROFILE` at the identity server's own
 * page; providing this after it is what moves it into the application.
 */
export function provideAccountConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NAVIGATE_TO_MANAGE_PROFILE,
      useFactory: () => {
        const router = inject(ABP_ROUTER);
        return () => void router.push('/account/manage');
      },
    },

    provideAppInitializer(() => {
      inject(RoutesService).add([
        {
          name: AccountRouteNames.Account,
          invisible: true,
          layout: LayoutType.account,
          breadcrumbText: AccountRouteNames.Account,
          iconClass: 'bi bi-person-gear',
          order: 1,
        },
        {
          path: '/account/login',
          name: AccountRouteNames.Login,
          parentName: AccountRouteNames.Account,
          layout: LayoutType.account,
          order: 1,
        },
        {
          path: '/account/register',
          name: AccountRouteNames.Register,
          parentName: AccountRouteNames.Account,
          layout: LayoutType.account,
          order: 2,
        },
        {
          path: '/account/manage',
          name: AccountRouteNames.ManageProfile,
          parentName: AccountRouteNames.Account,
          layout: LayoutType.application,
          breadcrumbText: 'AbpAccount::Manage',
          order: 3,
        },
        {
          path: '/account/forgot-password',
          name: AccountRouteNames.ForgotPassword,
          parentName: AccountRouteNames.Account,
          layout: LayoutType.account,
          invisible: true,
        },
        {
          path: '/account/reset-password',
          name: AccountRouteNames.ResetPassword,
          parentName: AccountRouteNames.Account,
          layout: LayoutType.account,
          invisible: true,
        },
      ]);
    }),
  ]);
}
