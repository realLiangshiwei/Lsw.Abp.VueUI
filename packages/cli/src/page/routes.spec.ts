import { describe, expect, it } from 'vitest';
import { CliError } from '../errors.js';
import type { EntityPage } from './entity.js';
import { insertRoute } from './routes.js';

const page = {
  entity: 'Book',
  plural: 'Books',
  fileBase: 'books',
  componentKey: 'BookStore.BooksComponent',
  resource: 'BookStore',
  route: '/books',
  menuKey: 'BookStore::Menu:Books',
  icon: 'bi bi-book',
  policies: { list: 'BookStore.Books' },
} as EntityPage;

const routes = [
  "import type { RouteRecordRaw } from 'vue-router';",
  "import HomePage from './pages/HomePage.vue';",
  '',
  'export const routes: RouteRecordRaw[] = [',
  '  {',
  "    path: '/',",
  '    component: HomePage,',
  "    meta: { title: 'AbpUi::Welcome', routes: { name: 'AbpUi::Welcome', order: 1 } },",
  '  },',
  '];',
  '',
].join('\n');

describe('insertRoute', () => {
  it('adds the route to the end of the array, after what is already there', () => {
    const { source, changed, replaced } = insertRoute(routes, page);

    expect(changed).toBe(true);
    expect(replaced).toBe(false);
    expect(source).toContain("path: '/books',");
    expect(source).toContain("component: () => import('./pages/BooksPage.vue'),");
    expect(source).toContain("requiredPolicy: 'BookStore.Books',");
    expect(source).toContain("order: 2, iconClass: 'bi bi-book'");
    expect(source.indexOf('abpv:begin route:books')).toBeGreaterThan(source.indexOf('HomePage,'));
  });

  it('is idempotent: a second run replaces its own entry rather than adding another', () => {
    const once = insertRoute(routes, page).source;
    const twice = insertRoute(once, page);

    expect(twice.replaced).toBe(true);
    expect(twice.changed).toBe(false);
    expect(twice.source).toBe(once);
    expect([...twice.source.matchAll(/path: '\/books'/g)]).toHaveLength(1);
  });

  it('brings its own entry up to date when the page has changed', () => {
    const once = insertRoute(routes, page).source;
    const moved = insertRoute(once, { ...page, route: '/library' } as EntityPage);

    expect(moved.changed).toBe(true);
    expect(moved.source).toContain("path: '/library',");
    expect(moved.source).not.toContain("path: '/books',");
  });

  it('is not fooled by a bracket inside a string or a comment', () => {
    const tricky = routes.replace(
      '    component: HomePage,',
      ['    component: HomePage,', '    // a ] in a comment', "    alias: '/]',"].join('\n'),
    );

    expect(insertRoute(tricky, page).source).toContain("path: '/books',");
  });

  it('says what to do when there is no routes array to add to', () => {
    expect(() => insertRoute('export const other = [];\n', page)).toThrow(CliError);
  });
});
