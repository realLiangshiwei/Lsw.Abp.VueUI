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

export type TreeNode<T> = T & {
  children: TreeNode<T>[];
  isLeaf: boolean;
  parent?: TreeNode<T> | undefined;
};

export interface RouteGroup<T> {
  group: string;
  items: TreeNode<T>[];
}
