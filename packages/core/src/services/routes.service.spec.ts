import { describe, expect, it } from 'vitest';
import { createInjector } from '../di/injector';
import type { ApplicationConfigurationDto } from '../proxy/models';
import { ConfigStateService } from './config-state.service';
import { RoutesService } from './routes.service';

function context() {
  const injector = createInjector([]);
  const configState = injector.get(ConfigStateService);
  const grant = (policies: Record<string, boolean>) =>
    configState.setState({
      ...configState.snapshot(),
      auth: { grantedPolicies: policies },
    } as ApplicationConfigurationDto);

  return { routes: injector.get(RoutesService), grant };
}

describe('RoutesService', () => {
  it('a route without the policy is not in the menu', () => {
    const { routes } = context();
    routes.add([
      { name: 'Dashboard', path: '/' },
      { name: 'Users', path: '/users', requiredPolicy: 'AbpIdentity.Users' },
    ]);

    expect(routes.visible.value.map(node => node.name)).toEqual(['Dashboard']);
  });

  it('the menu grows on its own after a login, with nobody refreshing it', () => {
    const { routes, grant } = context();
    routes.add([{ name: 'Users', path: '/users', requiredPolicy: 'AbpIdentity.Users' }]);
    expect(routes.visible.value).toHaveLength(0);

    grant({ 'AbpIdentity.Users': true });

    expect(routes.visible.value).toHaveLength(1);
  });

  it('a policy expression is understood here too', () => {
    const { routes, grant } = context();
    grant({ A: true });
    routes.add([{ name: 'Mixed', requiredPolicy: '(A || B) && A' }]);

    expect(routes.visible.value).toHaveLength(1);
  });

  it('what declares no group goes to AbpUi::OthersGroup', () => {
    const { routes } = context();
    routes.add([{ name: 'Users', group: 'Admin' }, { name: 'Dashboard' }]);

    expect(routes.groupedVisible.value?.map(group => group.group)).toEqual([
      'Admin',
      'AbpUi::OthersGroup',
    ]);
  });
});
