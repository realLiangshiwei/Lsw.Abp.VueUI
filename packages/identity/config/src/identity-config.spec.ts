import {
  APP_INITIALIZERS,
  createInjector,
  RoutesService,
  runInInjectionContext,
  type Injector,
} from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { IdentityPolicyNames } from './enums/policy-names.js';
import { IdentityRouteNames } from './enums/route-names.js';
import { provideIdentityConfig } from './providers/identity-config.provider.js';

/** What `createAbpApp` does at startup. */
function start(): Injector {
  const injector = createInjector([provideIdentityConfig()]);

  for (const initializer of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    runInInjectionContext(injector, initializer);
  }

  return injector;
}

describe('provideIdentityConfig', () => {
  // The tree drops an item whose parent is not registered, and `theme-shared` is what
  // registers administration, so the flat list is what this suite reads.
  const registered = (injector: Injector, name: string) =>
    injector.get(RoutesService).flat.value.find(route => route.name === name);

  it('files the module under administration, with a page each', () => {
    const injector = start();

    expect(injector.get(RoutesService).flat.value.map(route => route.name)).toEqual([
      IdentityRouteNames.IdentityManagement,
      IdentityRouteNames.Roles,
      IdentityRouteNames.Users,
    ]);

    expect(registered(injector, IdentityRouteNames.IdentityManagement)?.parentName).toBe(
      'AbpUiNavigation::Menu:Administration',
    );
    expect(registered(injector, IdentityRouteNames.Users)?.path).toBe('/identity/users');
  });

  it('shows the branch to whoever may see either page', () => {
    const injector = start();

    expect(registered(injector, IdentityRouteNames.IdentityManagement)?.requiredPolicy).toBe(
      IdentityPolicyNames.IdentityManagement,
    );
    expect(registered(injector, IdentityRouteNames.Roles)?.requiredPolicy).toBe(
      IdentityPolicyNames.Roles,
    );
  });

  it('is invisible until a policy is granted', () => {
    // Nothing is granted in a bare injector, so the whole branch stays out of the menu.
    expect(start().get(RoutesService).visible.value).toEqual([]);
  });
});
