import { describe, expect, it } from 'vitest';
import type { RouteRecordRaw } from 'vue-router';
import { IdentityComponents } from './enums/components.js';
import { createIdentityRoutes } from './routes.js';
import { IDENTITY_ENTITY_PROP_CONTRIBUTORS } from './tokens/extensions.token.js';

const children = (routes: RouteRecordRaw[]) => routes[0]?.children ?? [];
const at = (routes: RouteRecordRaw[], path: string) =>
  children(routes).find(route => route.path === path);

describe('createIdentityRoutes', () => {
  it('owns /identity and nothing else', () => {
    const routes = createIdentityRoutes();

    expect(routes).toHaveLength(1);
    expect(routes[0]?.path).toBe('/identity');
  });

  it('sends the bare path to the roles page', () => {
    expect(at(createIdentityRoutes(), '')?.redirect).toBe('/identity/roles');
  });

  it.each([
    ['roles', IdentityComponents.Roles, 'AbpIdentity.Roles'],
    ['users', IdentityComponents.Users, 'AbpIdentity.Users'],
  ])('puts %s behind its own policy, replaceable under its own key', (path, key, policy) => {
    const route = at(createIdentityRoutes(), path);

    expect(route?.meta?.requiredPolicy).toBe(policy);
    expect(route?.meta?.replaceableComponent?.key).toBe(key);
    expect(route?.meta?.replaceableComponent?.defaultComponent).toBeTruthy();
  });

  it('turns an anonymous visitor away before either page', () => {
    expect(createIdentityRoutes()[0]?.meta?.requiresAuthentication).toBe(true);
  });

  it('hands the host’s contributors to the route’s own injector', () => {
    const contributor = () => {};
    const routes = createIdentityRoutes({
      entityPropContributors: { [IdentityComponents.Users]: [contributor] },
    });

    const provider = routes[0]?.meta?.providers?.find(
      entry => (entry as { provide?: unknown }).provide === IDENTITY_ENTITY_PROP_CONTRIBUTORS,
    );

    expect((provider as { useValue?: unknown }).useValue).toEqual({
      [IdentityComponents.Users]: [contributor],
    });
  });
});
