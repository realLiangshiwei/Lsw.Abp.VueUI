import { AccountComponents } from '@lsw-abpvue/account-core';
import { LayoutType } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import type { RouteRecordRaw } from 'vue-router';
import { createAccountRoutes } from './routes.js';
import { ACCOUNT_APP_NAME } from './tokens/config-options.token.js';

const children = (routes: RouteRecordRaw[]) => routes[0]?.children ?? [];
const at = (routes: RouteRecordRaw[], path: string) =>
  children(routes).find(route => route.path === path);

describe('createAccountRoutes', () => {
  it('owns /account and nothing else', () => {
    const routes = createAccountRoutes();

    expect(routes).toHaveLength(1);
    expect(routes[0]?.path).toBe('/account');
    expect(routes[0]?.meta?.layout).toBe(LayoutType.account);
  });

  it('sends the bare path to the login page', () => {
    expect(at(createAccountRoutes(), '')?.redirect).toBe('/account/login');
  });

  it.each([
    ['login', AccountComponents.Login],
    ['register', AccountComponents.Register],
    ['forgot-password', AccountComponents.ForgotPassword],
    ['reset-password', AccountComponents.ResetPassword],
    ['manage', AccountComponents.ManageProfile],
  ])('renders %s under its own replaceable key', (path, key) => {
    const route = at(createAccountRoutes(), path);

    expect(route?.meta?.replaceableComponent?.key).toBe(key);
    expect(route?.meta?.replaceableComponent?.defaultComponent).toBeTruthy();
  });

  it.each(['login', 'register', 'forgot-password'])(
    'hands %s over to the identity server when the application does not log in itself',
    path => {
      expect(at(createAccountRoutes(), path)?.beforeEnter).toBeDefined();
    },
  );

  it('leaves the reset password page reachable whatever the flow is', () => {
    const route = at(createAccountRoutes(), 'reset-password');

    // The link arrives by mail, and it belongs to the tenant that issued it.
    expect(route?.beforeEnter).toBeUndefined();
    expect(route?.meta?.tenantBoxVisible).toBe(false);
  });

  it('is the one page inside the application, and behind the auth guard', () => {
    const route = at(createAccountRoutes(), 'manage');

    expect(route?.meta?.layout).toBe(LayoutType.application);
    expect(route?.meta?.requiresAuthentication).toBe(true);
  });

  it('carries what the host configured', () => {
    const routes = createAccountRoutes({ appName: 'BookStore' });
    const provider = routes[0]?.meta?.providers?.find(
      entry => (entry as { provide?: unknown }).provide === ACCOUNT_APP_NAME,
    );

    expect((provider as { useValue?: unknown }).useValue).toBe('BookStore');
  });
});
