import type { Component } from 'vue';
import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  ReplaceableComponentsService,
  type EnvironmentProviders,
  type LayoutType,
} from '@lsw-abpvue/core';
import {
  provideAbpThemeShared,
  provideThemeComponents,
  type ThemeComponents,
} from '@lsw-abpvue/theme-shared';

export function provideCustomTheme(
  controls: Required<ThemeComponents>,
  layouts: Record<LayoutType, Component>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAbpThemeShared(),
    provideThemeComponents(controls),
    provideAppInitializer(() => {
      const registry = inject(ReplaceableComponentsService);
      registry.add({ key: 'Theme.ApplicationLayoutComponent', component: layouts.application });
      registry.add({ key: 'Theme.AccountLayoutComponent', component: layouts.account });
      registry.add({ key: 'Theme.EmptyLayoutComponent', component: layouts.empty });
    }),
  ]);
}
