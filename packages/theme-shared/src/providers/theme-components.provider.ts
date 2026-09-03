import type { Provider } from '@lsw-abpvue/core';
import type { ThemeComponents } from '../contracts/component-key.js';
import { THEME_COMPONENTS } from '../tokens/theme-components.token.js';

/**
 * Registers component implementations. Later registrations win per key, so this both
 * installs a theme and patches one.
 * @param components The keys this provider implements
 */
export function provideThemeComponents(components: ThemeComponents): Provider<ThemeComponents[]> {
  return { provide: THEME_COMPONENTS, multi: true, useValue: components };
}
