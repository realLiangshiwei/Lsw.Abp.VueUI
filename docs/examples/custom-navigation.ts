import {
  AuthService,
  inject,
  provideAppInitializer,
  ReplaceableComponentsService,
  RoutesService,
} from '@lsw-abpvue/core';
import { NavItemsService, UserMenuItems, UserMenuService } from '@lsw-abpvue/theme-shared';
import { ABP_ROUTER } from '@lsw-abpvue/core/router';
import { ThemeBasicComponents } from '@lsw-abpvue/theme-basic';
import BrandLogo from './BrandLogo.vue';
import HelpNavItem from './HelpNavItem.vue';

export const customNavigation = provideAppInitializer(() => {
  const auth = inject(AuthService);
  const nav = inject(NavItemsService);
  const menu = inject(UserMenuService);
  const router = inject(ABP_ROUTER);
  const routes = inject(RoutesService);
  inject(ReplaceableComponentsService).add({
    key: ThemeBasicComponents.Logo,
    component: BrandLogo,
  });
  routes.add([
    { name: 'BookStore::Support', iconClass: 'bi bi-life-preserver', order: 20 },
    { name: 'BookStore::Help', parentName: 'BookStore::Support', path: '/help', order: 1 },
  ]);
  routes.patch('AbpIdentity::Menu:Identity', { order: 10 });
  nav.add([
    {
      name: 'BookStore.Help',
      component: HelpNavItem,
      order: 20,
    },
  ]);
  menu.add([
    {
      name: 'BookStore.Activity',
      text: { key: 'BookStore::Activity', defaultValue: 'My activity' },
      action: async () => {
        await router.push('/activity');
      },
      order: 5,
      visible: () => auth.isAuthenticated.value,
    },
  ]);
  menu.patch(UserMenuItems.MyAccount, { iconClass: 'bi bi-person-gear' });
});
