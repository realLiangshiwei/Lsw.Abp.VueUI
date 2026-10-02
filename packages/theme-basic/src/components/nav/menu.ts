import type { AbpRoute, TreeNode } from '@lsw-abpvue/core';

export function hasNavigationTarget(node: TreeNode<AbpRoute>): boolean {
  return Boolean(node.path) || node.children.some(hasNavigationTarget);
}
