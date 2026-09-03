import { computed, shallowRef, type ComputedRef } from 'vue';
import type { AbpNavItem, RouteGroup, TreeNode } from '../models/nav.js';

export interface NavTreeOptions<T extends AbpNavItem> {
  /** Keeps an item out of `visible`, along with everything under it. */
  hide?: ((item: T) => boolean) | undefined;
  sort?: ((a: T, b: T) => number) | undefined;
  /** Where items with no group end up in `groupedVisible`. */
  othersGroup?: string | undefined;
  /** Defaults to the `group` property, which is what `AbpRoute` carries. */
  groupBy?: ((item: T) => string | undefined) | undefined;
}

export interface NavTree<T extends AbpNavItem> {
  readonly flat: ComputedRef<T[]>;
  readonly tree: ComputedRef<TreeNode<T>[]>;
  /** The tree without what `hide` rejects — for a menu, what this user may see. */
  readonly visible: ComputedRef<TreeNode<T>[]>;
  /** `undefined` when nothing declares a group, which means "do not group at all". */
  readonly groupedVisible: ComputedRef<RouteGroup<T>[] | undefined>;
  /** Adds items, replacing any with the same name. */
  add(items: T[]): void;
  /** @returns `false` when no item has that name */
  patch(name: string, props: Partial<T>): boolean;
  /** Removes the named items and everything under them. */
  remove(names: string[]): void;
  removeByParam(params: Partial<T>): void;
  find(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | null;
  search(params: Partial<T>): TreeNode<T> | null;
  hasChildren(name: string): boolean;
  refresh(): void;
}

function byOrder<T extends AbpNavItem>(a: T, b: T): number {
  return (a.order ?? 0) - (b.order ?? 0);
}

/**
 * Builds the tree. An item naming a parent that is not in the list is dropped, which is
 * what removes a whole branch when its root is hidden.
 */
function toTree<T extends AbpNavItem>(items: readonly T[]): TreeNode<T>[] {
  const nodes = new Map<string, TreeNode<T>>(
    items.map(item => [item.name, { ...item, children: [], isLeaf: true } as TreeNode<T>]),
  );
  const roots: TreeNode<T>[] = [];

  for (const item of items) {
    const node = nodes.get(item.name);
    if (!node) continue;

    if (!item.parentName) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(item.parentName);
    if (!parent) continue;

    parent.children.push(node);
    parent.isLeaf = false;
    node.parent = parent;
  }

  return roots;
}

function depthFirst<T extends AbpNavItem>(
  nodes: readonly TreeNode<T>[],
  predicate: (node: TreeNode<T>) => boolean,
): TreeNode<T> | null {
  for (const node of nodes) {
    if (predicate(node)) return node;

    const found = depthFirst(node.children, predicate);
    if (found) return found;
  }

  return null;
}

/**
 * The tree behind menus, settings tabs and every other ordered, permission-filtered list
 * ABP shows. `visible` is a computed over the permission state, so logging in or
 * switching tenant rebuilds the menu without anyone subscribing to anything.
 */
export function createNavTree<T extends AbpNavItem>(options: NavTreeOptions<T> = {}): NavTree<T> {
  const {
    hide = () => false,
    sort = byOrder,
    othersGroup = 'AbpUi::OthersGroup',
    // `group` is on AbpRoute rather than AbpNavItem, so reading it needs the widening.
    groupBy = (item: T) => (item as { group?: string }).group,
  } = options;
  const items = shallowRef<T[]>([]);

  const tree = computed(() => toTree(items.value));
  const visible = computed(() => toTree(items.value.filter(item => !hide(item))));

  function publish(next: T[]): void {
    items.value = [...next].sort(sort);
  }

  /** Names of the given items and, recursively, of everything under them. */
  function withDescendants(names: Set<string>): Set<string> {
    const all = new Set(names);
    let added = true;

    while (added) {
      added = false;
      for (const item of items.value) {
        if (item.parentName && all.has(item.parentName) && !all.has(item.name)) {
          all.add(item.name);
          added = true;
        }
      }
    }

    return all;
  }

  return {
    flat: computed(() => items.value),
    tree,
    visible,

    groupedVisible: computed(() => {
      const roots = visible.value;
      // Nothing declares a group, so the caller wants a flat menu, not one big group.
      if (!roots.some(node => Boolean(groupBy(node)))) return undefined;

      const groups = new Map<string, TreeNode<T>[]>();
      for (const node of roots) {
        const key = groupBy(node) ?? othersGroup;
        groups.set(key, [...(groups.get(key) ?? []), node]);
      }

      return [...groups].map(([group, groupItems]) => ({ group, items: groupItems }));
    }),

    add: added => {
      const replaced = new Map(added.map(item => [item.name, item]));
      publish([...items.value.filter(item => !replaced.has(item.name)), ...added]);
    },

    patch: (name, props) => {
      const index = items.value.findIndex(item => item.name === name);
      if (index < 0) return false;

      const next = [...items.value];
      next[index] = { ...(next[index] as T), ...props };
      publish(next);
      return true;
    },

    remove: names => {
      const removed = withDescendants(new Set(names));
      publish(items.value.filter(item => !removed.has(item.name)));
    },

    removeByParam: params => {
      const keys = Object.keys(params) as (keyof T)[];
      if (keys.length === 0) return;

      const matched = items.value.filter(item => keys.every(key => item[key] === params[key]));
      if (matched.length === 0) return;

      const removed = withDescendants(new Set(matched.map(item => item.name)));
      publish(items.value.filter(item => !removed.has(item.name)));
    },

    find: predicate => depthFirst(tree.value, predicate),

    search: params => {
      const keys = Object.keys(params) as (keyof T)[];
      return depthFirst(tree.value, node => keys.every(key => node[key] === params[key]));
    },

    hasChildren: name =>
      (depthFirst(visible.value, node => node.name === name)?.children.length ?? 0) > 0,

    /** Kept for parity; the derived values recompute on their own. */
    refresh: () => publish([...items.value]),
  };
}
