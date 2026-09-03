import { defineToken } from '@lsw-abpvue/core';
import type { ThemeComponents } from '../contracts/component-key.js';

/**
 * Where themes register their implementations. Multi, and resolved last-first, so a host
 * overriding one component does not have to re-declare the eleven it is happy with.
 */
export const THEME_COMPONENTS = defineToken<ThemeComponents[]>('THEME_COMPONENTS', {
  multi: true,
  hint:
    'THEME_COMPONENTS is registered by a theme package.\n' +
    '  Did you forget provideAbpThemeBasic() in createAbpApp({ providers: [...] })?',
});
