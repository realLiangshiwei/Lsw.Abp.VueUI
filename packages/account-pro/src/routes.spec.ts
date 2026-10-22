import { LayoutType } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import AccountInvitationPage from './components/AccountInvitationPage.vue';
import { createAccountProRoutes } from './routes.js';

describe('public invitation routes', () => {
  it.each(['/account/invite', '/account/invitation'])(
    'matches %s without consuming the official mail query or requiring authentication',
    async path => {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: createAccountProRoutes(),
      });
      const query = { token: 'private+token/=', __tenant: 'tenant', returnUrl: '/identity/users' };
      await router.push({ path, query, hash: '#invitation' });
      await router.isReady();

      const route = router.currentRoute.value;
      expect(route.matched).toHaveLength(1);
      expect(route.matched[0]?.components?.default).toBe(AccountInvitationPage);
      expect(route.path).toBe(path);
      expect(route.query).toEqual(query);
      expect(route.hash).toBe('#invitation');
      expect(route.meta).toMatchObject({
        title: 'AbpIdentity::InviteUser',
        layout: LayoutType.account,
        tenantBoxVisible: false,
      });
      expect(route.meta.requiresAuthentication).not.toBe(true);
    },
  );
});
