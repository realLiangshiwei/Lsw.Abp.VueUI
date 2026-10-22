import { EntityAction, ExtensionsService, ToolbarAction } from '@lsw-abpvue/components';
import { createInjector } from '@lsw-abpvue/core';
import {
  createIdentityRoutes,
  IdentityComponents,
  identityExtensionsResolver,
} from '@lsw-abpvue/identity';
import { describe, expect, it } from 'vitest';
import UsersPage from './components/UsersPage.vue';
import RolesPage from './components/RolesPage.vue';
import ClaimsPage from './components/ClaimsPage.vue';
import { IdentityProComponents } from './enums/components.js';
import { createIdentityProRoutes } from './routes.js';
import { identityProExtensionsResolver } from './resolvers/extensions.resolver.js';

describe('createIdentityProRoutes', () => {
  it('owns one identity route with commercial role, user and claim type pages', () => {
    const routes = createIdentityProRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]?.path).toBe('/identity');
    expect(routes[0]?.meta?.requiresAuthentication).toBe(true);
    expect(routes[0]?.children?.find(route => route.path === 'roles')?.meta).toMatchObject({
      requiredPolicy: 'AbpIdentity.Roles',
      replaceableComponent: { key: IdentityComponents.Roles, defaultComponent: RolesPage },
    });
    expect(routes[0]?.children?.find(route => route.path === 'claim-types')?.meta).toMatchObject({
      requiredPolicy: 'AbpIdentity.ClaimTypes',
      replaceableComponent: { key: IdentityProComponents.Claims, defaultComponent: ClaimsPage },
    });
    expect(routes[0]?.children?.find(route => route.path === 'users')?.meta).toMatchObject({
      requiredPolicy: 'AbpIdentity.Users',
      replaceableComponent: { key: IdentityComponents.Users, defaultComponent: UsersPage },
    });
  });

  it('lets application contributors change commercial defaults and survives repeated assembly', () => {
    const host = EntityAction.create({ text: 'HostAction', action: () => {} });
    const toolbar = ToolbarAction.create({ text: 'HostToolbar', action: () => {} });
    const routes = createIdentityProRoutes({
      entityActionContributors: {
        [IdentityComponents.Users]: [
          list => {
            list.dropByValue('AbpIdentity::Lock', (action, text) => action.text === text);
            list.addTail(host);
          },
        ],
      },
      toolbarActionContributors: {
        [IdentityComponents.Users]: [list => list.addTail(toolbar)],
      },
    });
    const injector = createInjector(routes[0]?.meta?.providers ?? []);
    const extensions = injector.get(ExtensionsService);

    for (let run = 0; run < 2; run += 1) {
      injector.runInContext(identityProExtensionsResolver);
      const actions = extensions.entityActions.get(IdentityComponents.Users).actions.toArray();
      expect(actions.map(action => action.text)).toEqual([
        'AbpIdentity::ViewDetails',
        'AbpUi::Edit',
        'AbpIdentity::Claims',
        'AbpIdentity::Unlock',
        'AbpIdentity::Permissions',
        'AbpIdentity::SetPassword',
        'AbpIdentity::ChangeHistory',
        'AbpIdentity::Sessions',
        'AbpIdentity::SecurityLogs',
        'AbpIdentity::LoginWithThisUser',
        'AbpIdentity::TwoFactor',
        'AbpUi::Delete',
        'AbpIdentity::RemoveFromTenant',
        'HostAction',
      ]);
      expect(
        extensions.toolbarActions
          .get(IdentityComponents.Users)
          .actions.toArray()
          .map(action => action.text),
      ).toEqual([
        'AbpIdentity::NewUser',
        'AbpIdentity::Search',
        'AbpIdentity::InviteUser',
        'AbpIdentity::PendingInvitation',
        'AbpIdentity::ExternalUser',
        'AbpIdentity::Export',
        'AbpIdentity::Import',
        'HostToolbar',
      ]);
    }
  });

  it('does not remove open source user editing when commercial routes are unused', () => {
    const injector = createInjector(createIdentityRoutes()[0]?.meta?.providers ?? []);
    injector.runInContext(identityExtensionsResolver);
    const extensions = injector.get(ExtensionsService);
    expect(
      extensions.entityActions
        .get(IdentityComponents.Users)
        .actions.toArray()
        .map(action => action.text),
    ).toContain('AbpUi::Edit');
    expect(
      extensions.toolbarActions
        .get(IdentityComponents.Users)
        .actions.toArray()
        .map(action => action.text),
    ).toContain('AbpIdentity::NewUser');
  });
});
