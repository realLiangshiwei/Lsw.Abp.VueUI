import type { AbpNavItem, LocalizationParam } from '@lsw-abpvue/core';
import type { Component } from 'vue';
import type { AbpSeverity } from '../contracts/common.js';

export interface NavItemBadge {
  /** A function is re-read on every render, for a count that changes. */
  count?: number | (() => number) | undefined;
  severity?: AbpSeverity | undefined;
  iconClass?: string | undefined;
}

/**
 * An entry of the navbar or of the user dropdown. Text and icon cover the ordinary case;
 * `component` is for the ones that are not a link at all, such as the language switcher.
 */
export interface NavItem extends AbpNavItem {
  /** Localization key of the label. */
  text?: LocalizationParam | undefined;
  iconClass?: string | undefined;
  /** Rendered in place of text and icon. */
  component?: Component | undefined;
  /** Where clicking it goes, when it goes somewhere. */
  path?: string | undefined;
  action?: (() => void | Promise<void>) | undefined;
  badge?: NavItemBadge | undefined;
  /**
   * An extra condition on top of `requiredPolicy`. Synchronous and reactive: it is read
   * inside a computed, so anything reactive it touches keeps the menu up to date.
   */
  visible?: (() => boolean) | undefined;
}
