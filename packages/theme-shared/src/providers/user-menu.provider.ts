import {
  AuthService,
  inject,
  makeEnvironmentProviders,
  NAVIGATE_TO_MANAGE_PROFILE,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { UserMenuItems } from '../defaults/user-menu-items.js';
import { UserMenuService } from '../services/nav-items.service.js';

/**
 * The two entries every theme's user dropdown has. They are here rather than in a theme
 * because neither of them draws anything: one opens the backend's profile page, the
 * other ends the session. A theme that wants different ones patches them by id.
 */
export function provideUserMenuItems(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const userMenu = inject(UserMenuService);
      const auth = inject(AuthService, { optional: true });
      const manageProfile = inject(NAVIGATE_TO_MANAGE_PROFILE, { optional: true });

      userMenu.add([
        {
          name: UserMenuItems.MyAccount,
          order: 100,
          text: { key: 'AbpAccount::MyAccount', defaultValue: 'My account' },
          iconClass: 'bi bi-gear',
          visible: () => manageProfile !== null,
          action: () => manageProfile?.(),
        },
        {
          name: UserMenuItems.Logout,
          order: 101,
          text: { key: 'AbpUi::Logout', defaultValue: 'Logout' },
          iconClass: 'bi bi-power',
          visible: () => auth !== null,
          action: async () => {
            await auth?.logout();
          },
        },
      ]);
    }),
  ]);
}
