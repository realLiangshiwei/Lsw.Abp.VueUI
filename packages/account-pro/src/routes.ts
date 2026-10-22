import { LayoutType } from '@lsw-abpvue/core';
import type { RouteRecordRaw } from 'vue-router';
import AccountInvitationPage from './components/AccountInvitationPage.vue';
import AccountWorkflowsPage from './components/AccountWorkflowsPage.vue';
export function createAccountProRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '/account/workflows',
      component: AccountWorkflowsPage,
      meta: { title: 'AbpAccount::LinkedAccounts', layout: LayoutType.application },
    },
    {
      path: '/account/invite',
      alias: '/account/invitation',
      component: AccountInvitationPage,
      meta: {
        title: 'AbpIdentity::InviteUser',
        layout: LayoutType.account,
        tenantBoxVisible: false,
      },
    },
  ];
}
