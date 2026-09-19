import type { Component } from 'vue';
import type { LocalizationParam } from './localization.js';

/** Anything that can sit in one of ABP's trees: menus, tabs, settings pages. */
export interface AbpNavItem {
  name: string;
  parentName?: string | undefined;
  requiredPolicy?: string | undefined;
  order?: number | undefined;
  invisible?: boolean | undefined;
}

export const LayoutType = {
  application: 'application',
  account: 'account',
  empty: 'empty',
} as const;
export type LayoutType = (typeof LayoutType)[keyof typeof LayoutType];

export interface AbpRoute extends AbpNavItem {
  path?: string | undefined;
  layout?: LayoutType | undefined;
  iconClass?: string | undefined;
  group?: string | undefined;
  breadcrumbText?: string | undefined;
}

/**
 * A tab of a page other modules add to -- the profile page, the settings page. It names
 * a component rather than a route: the tabs of one page are one navigation, and which of
 * them is open is that page's state.
 */
export interface AbpNavTab extends AbpNavItem {
  /** Rendered while this is the selected tab. */
  component: Component;
  /** Localization key of the label. The name is localized instead when there is none. */
  text?: LocalizationParam | undefined;
  iconClass?: string | undefined;
  /**
   * An extra condition on top of `requiredPolicy`. Read inside a computed, so anything
   * reactive it touches keeps the tab list up to date.
   */
  visible?: (() => boolean) | undefined;
}

export type TreeNode<T> = T & {
  children: TreeNode<T>[];
  isLeaf: boolean;
  parent?: TreeNode<T> | undefined;
};

export interface RouteGroup<T> {
  group: string;
  items: TreeNode<T>[];
}
