import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@lsw-abpvue/core';
import { provideAbpThemeShared } from '@lsw-abpvue/theme-shared';
import { provideThemeBasicLayouts } from './layout.provider.js';
import { DirectionService } from '../services/direction.service.js';
import { ThemeModeService } from '../services/theme-mode.service.js';
import { provideThemeBasicComponents } from './theme-components.provider.js';

/**
 * Installs the basic theme: the twelve contracts, and everything `theme-shared` needs at
 * application scope. An application provides this rather than `provideAbpThemeShared()`.
 */
export function provideAbpThemeBasic(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAbpThemeShared(),
    provideThemeBasicComponents(),
    provideThemeBasicLayouts(),

    provideAppInitializer(() => {
      inject(ThemeModeService).init();
      inject(DirectionService).init();
    }),
  ]);
}
