import type { AbpNavTab } from '@lsw-abpvue/core';

/**
 * One tab of the profile page. A module adds its own by registering one of these, which
 * is what makes the page extensible; ABP's Angular UI has the two tabs written into the
 * template instead (difference +).
 */
export interface ProfileTab extends AbpNavTab {
  /** Localization key of the tab label; required here, unlike a settings tab. */
  text: NonNullable<AbpNavTab['text']>;
}
