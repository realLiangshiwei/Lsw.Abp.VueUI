import {
  APP_INITIALIZERS,
  AuthService,
  ConfigStateService,
  createInjector,
  type Injector,
  RoutesService,
} from '@lsw-abpvue/core';
import { UserMenuService } from '@lsw-abpvue/theme-shared';
import { computed, ref } from 'vue';
import { expect, it } from 'vitest';
import { provideAccountProConfig } from './providers/account-pro-config.provider.js';

it('registers commercial route metadata and follows customized personal navigation paths', async () => {
  const injector: Injector = createInjector([
    provideAccountProConfig(),
    { provide: AuthService, useValue: { isAuthenticated: computed(() => true) } },
  ]);
  try {
    for (const initialize of injector.get(APP_INITIALIZERS, [], { optional: true }))
      injector.runInContext(initialize);
    const routes = injector.get(RoutesService);
    const menu = injector.get(UserMenuService);
    const expected = {
      'AbpAccount::LoginWithRecoveryCode': '/account/login-with-recovery-code',
      'AbpAccount::EmailConfirmation': '/account/email-confirmation',
      'AbpAccount::LinkLogged': '/account/link-logged',
      'AbpAccount::TwoFactorVerification': '/account/send-security-code',
      'AbpAccount::MySecurityLogs': '/account/security-logs',
      'AbpIdentity::Sessions': '/account/sessions',
      'AbpAccount::ConfirmUser': '/account/confirm-user',
      'AbpIdentity::InviteUser': '/account/invite',
    };
    for (const [name, path] of Object.entries(expected))
      expect(routes.search({ name })?.path).toBe(path);
    routes.patch('AbpIdentity::Sessions', { path: '/my/sessions' });
    expect(menu.search({ name: 'Account.Sessions' })?.path).toBe('/my/sessions');
    routes.remove(['AbpIdentity::Sessions']);
    expect(menu.search({ name: 'Account.Sessions' })?.path).toBeUndefined();
  } finally {
    injector.destroy();
  }
});

it('updates account navigation as authentication, sharing and impersonation change', () => {
  const authenticated = ref(false);
  const injector = createInjector([
    provideAccountProConfig(),
    { provide: AuthService, useValue: { isAuthenticated: computed(() => authenticated.value) } },
  ]);
  try {
    for (const initialize of injector.get(APP_INITIALIZERS, [], { optional: true }))
      injector.runInContext(initialize);
    const menu = injector.get(UserMenuService);
    const paths = () => menu.visible.value.map(item => item.path);
    expect(paths()).toEqual([]);
    authenticated.value = true;
    expect(paths()).toEqual([
      '/account/workflows?section=links',
      '/account/workflows?section=delegation',
      '/account/security-logs',
      '/account/sessions',
    ]);
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      multiTenancy: { ...config.snapshot().multiTenancy, userSharingStrategy: 1 },
      currentUser: { ...config.snapshot().currentUser, impersonatorUserId: 'original-user' },
    });
    expect(paths()).toContain('/account/workflows?section=tenants');
    expect(paths()).toContain('/account/workflows?section=return');
    expect(injector.get(RoutesService).visible.value).toEqual([]);
  } finally {
    injector.destroy();
  }
});
