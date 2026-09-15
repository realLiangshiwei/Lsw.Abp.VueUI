import { AccountComponents } from '@lsw-abpvue/account-core';
import { AccountRouteNames } from '@lsw-abpvue/account/config';
import { LayoutType } from '@lsw-abpvue/core';
import { AbpReplaceableRouteContainer, AbpRouterOutlet } from '@lsw-abpvue/core/router';
import type { RouteRecordRaw } from 'vue-router';
import ForgotPasswordPage from './components/ForgotPasswordPage.vue';
import LoginPage from './components/LoginPage.vue';
import RegisterPage from './components/RegisterPage.vue';
import ResetPasswordPage from './components/ResetPasswordPage.vue';
import { authenticationFlowGuard } from './guards/authentication-flow.guard.js';
import type { AccountConfigOptions } from './models/config-options.js';
import { provideAccount } from './providers/account.provider.js';

/**
 * The routes of the account module. Every page but the profile one is behind
 * `authenticationFlowGuard`: with the authorization code flow the identity server owns
 * them, and asking for one here hands over to it.
 *
 * Meant to be lazy loaded, with `@lsw-abpvue/account/config` putting the menu entries and
 * the profile link up at startup.
 *
 * @param options What the host configured and contributed
 */
export function createAccountRoutes(options: AccountConfigOptions = {}): RouteRecordRaw[] {
  return [
    {
      path: '/account',
      component: AbpRouterOutlet,
      meta: { providers: provideAccount(options), layout: LayoutType.account },
      children: [
        { path: '', redirect: '/account/login' },
        {
          path: 'login',
          component: AbpReplaceableRouteContainer,
          beforeEnter: [authenticationFlowGuard],
          meta: {
            title: AccountRouteNames.Login,
            replaceableComponent: { key: AccountComponents.Login, defaultComponent: LoginPage },
          },
        },
        {
          path: 'register',
          component: AbpReplaceableRouteContainer,
          beforeEnter: [authenticationFlowGuard],
          meta: {
            title: AccountRouteNames.Register,
            replaceableComponent: {
              key: AccountComponents.Register,
              defaultComponent: RegisterPage,
            },
          },
        },
        {
          path: 'forgot-password',
          component: AbpReplaceableRouteContainer,
          beforeEnter: [authenticationFlowGuard],
          meta: {
            title: AccountRouteNames.ForgotPassword,
            replaceableComponent: {
              key: AccountComponents.ForgotPassword,
              defaultComponent: ForgotPasswordPage,
            },
          },
        },
        {
          // No flow guard: the link in the mail is the whole point, and it arrives
          // whether or not this application is the one that logs people in. The tenant
          // is the one that issued it, so the box that would switch it stays away.
          path: 'reset-password',
          component: AbpReplaceableRouteContainer,
          meta: {
            title: AccountRouteNames.ResetPassword,
            tenantBoxVisible: false,
            replaceableComponent: {
              key: AccountComponents.ResetPassword,
              defaultComponent: ResetPasswordPage,
            },
          },
        },
      ],
    },
  ];
}
