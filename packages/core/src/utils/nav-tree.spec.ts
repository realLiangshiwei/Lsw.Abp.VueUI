import { describe, expect, it } from 'vitest';
import type { AbpRoute } from '../models/nav.js';
import { createNavTree } from './nav-tree.js';

const route = (name: string, extra: Partial<AbpRoute> = {}): AbpRoute => ({ name, ...extra });

function tree(...routes: AbpRoute[]) {
  const nav = createNavTree<AbpRoute>({ hide: item => item.invisible === true });
  nav.add(routes);
  return nav;
}

describe('adding and ordering', () => {
  it('orders by order, and what has none counts as 0', () => {
    const nav = tree(route('c', { order: 3 }), route('a'), route('b', { order: 1 }));

    expect(nav.flat.value.map(item => item.name)).toEqual(['a', 'b', 'c']);
  });

  it('a later item of the same name replaces the earlier one rather than appearing twice', () => {
    const nav = tree(route('users', { order: 1 }));

    nav.add([route('users', { order: 5, iconClass: 'new' })]);

    expect(nav.flat.value).toHaveLength(1);
    expect(nav.flat.value[0]?.iconClass).toBe('new');
  });
});

describe('building the tree', () => {
  it('a parent stops being a leaf once a child is attached', () => {
    const nav = tree(route('identity'), route('users', { parentName: 'identity' }));
    const [root] = nav.tree.value;

    expect(root?.name).toBe('identity');
    expect(root?.isLeaf).toBe(false);
    expect(root?.children.map(child => child.name)).toEqual(['users']);
    expect(root?.children[0]?.parent?.name).toBe('identity');
  });

  it('an item whose parent is missing does not appear at all rather than moving to the top', () => {
    const nav = tree(route('users', { parentName: 'nope' }));

    expect(nav.tree.value).toHaveLength(0);
  });
});

describe('visibility', () => {
  it('a hidden item and everything under it stay out of visible', () => {
    const nav = tree(
      route('identity', { invisible: true }),
      route('users', { parentName: 'identity' }),
      route('dashboard'),
    );

    expect(nav.visible.value.map(node => node.name)).toEqual(['dashboard']);
    expect(nav.tree.value).toHaveLength(2);
  });

  it('hasChildren looks at the visible tree', () => {
    const nav = tree(
      route('identity'),
      route('users', { parentName: 'identity' }),
      route('roles', { parentName: 'identity', invisible: true }),
    );

    expect(nav.hasChildren('identity')).toBe(true);
    expect(nav.hasChildren('users')).toBe(false);
  });
});

describe('grouping', () => {
  it('returns undefined when nothing declares a group', () => {
    expect(tree(route('a'), route('b')).groupedVisible.value).toBeUndefined();
  });

  it('groups by group, and what has none goes to others', () => {
    const nav = createNavTree<AbpRoute>({ othersGroup: 'Others' });
    nav.add([route('a', { group: 'Admin' }), route('b'), route('c', { group: 'Admin' })]);

    expect(nav.groupedVisible.value).toEqual([
      {
        group: 'Admin',
        items: [expect.objectContaining({ name: 'a' }), expect.objectContaining({ name: 'c' })],
      },
      { group: 'Others', items: [expect.objectContaining({ name: 'b' })] },
    ]);
  });
});

describe('patching and removing', () => {
  it('patch merges the properties and reorders', () => {
    const nav = tree(route('a', { order: 1 }), route('b', { order: 2 }));

    expect(nav.patch('a', { order: 9, iconClass: 'x' })).toBe(true);
    expect(nav.flat.value.map(item => item.name)).toEqual(['b', 'a']);
    expect(nav.flat.value[1]?.iconClass).toBe('x');
  });

  it('patching a name that is not there returns false', () => {
    expect(tree(route('a')).patch('nope', { order: 1 })).toBe(false);
  });

  it('remove takes the descendants with it', () => {
    const nav = tree(
      route('identity'),
      route('users', { parentName: 'identity' }),
      route('claims', { parentName: 'users' }),
      route('dashboard'),
    );

    nav.remove(['identity']);

    expect(nav.flat.value.map(item => item.name)).toEqual(['dashboard']);
  });

  it('removeByParam removes by property, descendants included', () => {
    const nav = tree(
      route('identity', { group: 'Admin' }),
      route('users', { parentName: 'identity' }),
      route('dashboard'),
    );

    nav.removeByParam({ group: 'Admin' });

    expect(nav.flat.value.map(item => item.name)).toEqual(['dashboard']);
  });

  it('removeByParam with an empty object does nothing', () => {
    const nav = tree(route('a'));

    nav.removeByParam({});

    expect(nav.flat.value).toHaveLength(1);
  });
});

describe('finding', () => {
  const nav = tree(route('identity'), route('users', { parentName: 'identity', path: '/users' }));

  it('find goes depth first', () => {
    expect(nav.find(node => node.path === '/users')?.name).toBe('users');
    expect(nav.find(node => node.name === 'nope')).toBeNull();
  });

  it('search matches a property exactly', () => {
    expect(nav.search({ name: 'users' })?.path).toBe('/users');
    expect(nav.search({ name: 'users', path: '/other' })).toBeNull();
  });
});
