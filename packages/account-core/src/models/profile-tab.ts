import type { AbpNavItem, LocalizationParam } from '@lsw-abpvue/core';
import type { Component } from 'vue';

/**
 * One tab of the profile page. A module adds its own by registering one of these, which
 * is what makes the page extensible; ABP's Angular UI has the two tabs written into the
 * template instead (difference +).
 */
export interface ProfileTab extends AbpNavItem {
  /** Localization key of the tab label. */
  text: LocalizationParam;
  /** Rendered when the tab is the selected one. */
  component: Component;
  iconClass?: string | undefined;
  /**
   * An extra condition on top of `requiredPolicy`. Read inside a computed, so anything
   * reactive it touches keeps the tab list up to date -- which is how the change
   * password tab disappears for a user who signs in through an external provider.
   */
  visible?: (() => boolean) | undefined;
}
