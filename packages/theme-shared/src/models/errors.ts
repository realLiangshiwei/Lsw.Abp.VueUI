import type { AbpComponentKey } from '../contracts/component-key.js';

/**
 * A contract component was rendered with no theme behind it. Thrown rather than rendered
 * as nothing, because an empty page is a much longer debugging session than a stack
 * trace naming the key.
 */
export class MissingThemeComponentError extends Error {
  readonly key: AbpComponentKey;

  constructor(key: AbpComponentKey) {
    super(
      `No theme provides ${key}.\n` +
        '  A theme registers its components with provideThemeComponents(), which\n' +
        `  provideAbpThemeBasic() does for all twelve. Add it to createAbpApp({ providers: [...] }),\n` +
        `  or register ${key} yourself with provideThemeComponents({ ${key}: MyComponent }).`,
    );
    this.name = 'MissingThemeComponentError';
    this.key = key;
  }
}
