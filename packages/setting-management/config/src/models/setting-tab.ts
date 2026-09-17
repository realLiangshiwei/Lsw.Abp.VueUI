import type { AbpNavItem, LocalizationParam } from '@lsw-abpvue/core';
import type { Component } from 'vue';

/**
 * One tab of the settings page. A module with something to configure registers one of
 * these instead of replacing the page.
 */
export interface SettingTab extends AbpNavItem {
  /** Rendered when the tab is the selected one. */
  component: Component;
  /**
   * Localization key of the label. ABP's Angular UI localizes the name itself, which is
   * what happens here too when this is left out.
   */
  text?: LocalizationParam | undefined;
  iconClass?: string | undefined;
  /**
   * An extra condition on top of `requiredPolicy`. Read inside a computed, so anything
   * reactive it touches keeps the tab list up to date -- which is how a tab whose
   * feature is switched off for the current tenant disappears.
   */
  visible?: (() => boolean) | undefined;
}
