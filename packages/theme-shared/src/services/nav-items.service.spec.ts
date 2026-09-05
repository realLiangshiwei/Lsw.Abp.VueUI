import {
  APP_INITIALIZERS,
  AuthService,
  ConfigStateService,
  createInjector,
  NAVIGATE_TO_MANAGE_PROFILE,
  runInInjectionContext,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { describe, expect, it, vi } from 'vitest';
import { UserMenuItems } from '../defaults/user-menu-items.js';
import { provideUserMenuItems } from '../providers/user-menu.provider.js';
import { NavItemsService, UserMenuService } from './nav-items.service.js';

function withPolicies(injector: Injector, ...policies: string[]): void {
  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: Object.fromEntries(policies.map(policy => [policy, true])) },
  });
}

/** Runs what `provideAppInitializer` registered, which bootstrapping would do. */
function start(providers: ProviderInput[]): Injector {
  const injector = createInjector(providers);

  for (const initializer of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    runInInjectionContext(injector, initializer);
  }

  return injector;
}

describe('NavItemsService', () => {
  it('keeps items ordered and addressable by name', () => {
    const navItems = createInjector([]).get(NavItemsService);

    navItems.add([
      { name: 'Theme.CurrentUserComponent', order: 200 },
      { name: 'Theme.LanguagesComponent', order: 100 },
    ]);

    expect(navItems.visible.value.map(item => item.name)).toEqual([
      'Theme.LanguagesComponent',
      'Theme.CurrentUserComponent',
    ]);
  });

  it('is a different tree from the user menu', () => {
    const injector = createInjector([]);
    injector.get(NavItemsService).add([{ name: 'Theme.LanguagesComponent' }]);

    expect(injector.get(UserMenuService).visible.value).toHaveLength(0);
  });

  it('hides what the extra condition rejects', () => {
    const injector = createInjector([]);
    const navItems = injector.get(NavItemsService);

    navItems.add([
      {
        name: 'Theme.CurrentUserComponent',
        visible: () => injector.get(ConfigStateService).snapshot().currentUser.isAuthenticated,
      },
    ]);
    expect(navItems.visible.value).toHaveLength(0);

    const configState = injector.get(ConfigStateService);
    configState.setState({
      ...configState.snapshot(),
      currentUser: { ...configState.snapshot().currentUser, isAuthenticated: true },
    });

    expect(navItems.visible.value).toHaveLength(1);
  });

  it('hides what the user has no policy for', () => {
    const injector = createInjector([]);
    withPolicies(injector, 'Books.Manage');
    const navItems = injector.get(NavItemsService);

    navItems.add([
      { name: 'Books', requiredPolicy: 'Books.Manage' },
      { name: 'Secrets', requiredPolicy: 'Secrets.Manage' },
    ]);

    expect(navItems.visible.value.map(item => item.name)).toEqual(['Books']);
  });
});

describe('the default user menu', () => {
  it('opens the backend profile page and logs out', async () => {
    const manageProfile = vi.fn();
    const logout = vi.fn(async () => {});
    const injector = start([
      provideUserMenuItems(),
      { provide: NAVIGATE_TO_MANAGE_PROFILE, useValue: manageProfile },
      { provide: AuthService, useValue: { logout } as unknown as AuthService },
    ]);

    const items = injector.get(UserMenuService).visible.value;
    expect(items.map(item => item.name)).toEqual([UserMenuItems.MyAccount, UserMenuItems.Logout]);

    await items[0]?.action?.();
    await items[1]?.action?.();

    expect(manageProfile).toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
  });

  it('leaves out the entries nothing can carry out', () => {
    const injector = start([provideUserMenuItems()]);

    expect(injector.get(UserMenuService).visible.value).toHaveLength(0);
    expect(injector.get(UserMenuService).flat.value).toHaveLength(2);
  });
});
