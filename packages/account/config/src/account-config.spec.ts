import {
  APP_INITIALIZERS,
  createInjector,
  LayoutType,
  NAVIGATE_TO_MANAGE_PROFILE,
  RoutesService,
  runInInjectionContext,
  type Injector,
} from '@lsw-abpvue/core';
import { ABP_ROUTER } from '@lsw-abpvue/core/router';
import { describe, expect, it, vi } from 'vitest';
import { AccountRouteNames } from './enums/route-names.js';
import { provideAccountConfig } from './providers/account-config.provider.js';

function start(push = vi.fn(() => Promise.resolve())): Injector {
  const injector = createInjector([
    provideAccountConfig(),
    { provide: ABP_ROUTER, useValue: { push } as never },
  ]);

  for (const initializer of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    runInInjectionContext(injector, initializer);
  }

  return injector;
}

describe('provideAccountConfig', () => {
  it('registers the account pages, and the layout each of them wants', () => {
    const routes = start().get(RoutesService);

    expect(routes.search({ name: AccountRouteNames.Login })?.layout).toBe(LayoutType.account);
    expect(routes.search({ name: AccountRouteNames.ManageProfile })?.layout).toBe(
      LayoutType.application,
    );
    expect(routes.search({ name: AccountRouteNames.ResetPassword })?.path).toBe(
      '/account/reset-password',
    );
  });

  it('keeps the whole branch out of the menu', () => {
    // The account pages are reached from the login flow and the user menu, never from
    // the sidebar; an invisible parent takes its children with it.
    expect(start().get(RoutesService).visible.value).toEqual([]);
  });

  it('points the user menu at the profile page inside the application', async () => {
    const push = vi.fn(() => Promise.resolve());
    start(push).get(NAVIGATE_TO_MANAGE_PROFILE)();

    expect(push).toHaveBeenCalledWith('/account/manage');
  });
});
