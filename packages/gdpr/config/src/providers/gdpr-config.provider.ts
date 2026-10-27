import {
  AuthService,
  inject,
  LayoutType,
  makeEnvironmentProviders,
  provideAppInitializer,
  RoutesService,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { UserMenuService } from '@lsw-abpvue/theme-shared';
import type { AbpCookieConsentOptions, GdprFeature } from '../models/options.js';
import { CookieConsentService } from '../services/cookie-consent.service.js';

export function withCookieConsentOptions(options: AbpCookieConsentOptions = {}): GdprFeature {
  return { options };
}

export function provideGdprConfig(...features: GdprFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const routes = inject(RoutesService);
      const now = new Date();
      inject(CookieConsentService).setOptions({
        isEnabled: true,
        expireDate: new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()),
        ...features.at(-1)?.options,
      });
      routes.add([
        {
          name: 'Gdpr.GdprComponent',
          path: '/gdpr',
          invisible: true,
          layout: LayoutType.application,
          breadcrumbText: 'AbpGdpr::Menu:PersonalData',
          iconClass: 'bi bi-lock',
        },
      ]);
      inject(UserMenuService).add([
        {
          name: 'Gdpr.GdprNavigation',
          text: 'AbpGdpr::Menu:PersonalData',
          path: '/gdpr',
          order: 100,
          iconClass: 'bi bi-lock',
          visible: () => auth.isAuthenticated.value,
        },
      ]);
    }),
  ]);
}
