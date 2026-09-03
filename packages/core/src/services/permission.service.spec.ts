import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createInjector } from '../di/injector.js';
import type { ApplicationConfigurationDto } from '../proxy/models.js';
import { ConfigStateService } from './config-state.service.js';
import { PermissionService } from './permission.service.js';

function permissions(policies: Record<string, boolean>) {
  const injector = createInjector([]);
  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: policies },
  } as ApplicationConfigurationDto);

  return { permission: injector.get(PermissionService), configState };
}

describe('PermissionService', () => {
  it('a granted policy is true', () => {
    expect(
      permissions({ 'AbpIdentity.Users': true }).permission.isGranted('AbpIdentity.Users'),
    ).toBe(true);
  });

  it('not granted, or granted as false, are both false', () => {
    const { permission } = permissions({ 'AbpIdentity.Users': false });

    expect(permission.isGranted('AbpIdentity.Users')).toBe(false);
    expect(permission.isGranted('Nope')).toBe(false);
  });

  it('an empty policy counts as granted, as in Angular', () => {
    const { permission } = permissions({});

    expect(permission.isGranted(undefined)).toBe(true);
    expect(permission.isGranted('')).toBe(true);
  });

  it('a broken expression is false and warns in development rather than throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { permission } = permissions({ A: true });

    expect(permission.isGranted('A &&')).toBe(false);
    warn.mockRestore();
  });

  it('the reactive form follows a configuration refresh', () => {
    const { permission, configState } = permissions({});
    const granted = permission.isGrantedRef('AbpIdentity.Users');
    expect(granted.value).toBe(false);

    configState.setState({
      ...configState.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true } },
    } as ApplicationConfigurationDto);

    expect(granted.value).toBe(true);
  });

  it('a policy may be a ref or a getter and follows it', () => {
    const { permission } = permissions({ A: true });
    const policy = ref('A');
    const fromRef = permission.isGrantedRef(policy);
    const fromGetter = permission.isGrantedRef(() => policy.value);

    expect([fromRef.value, fromGetter.value]).toEqual([true, true]);

    policy.value = 'B';

    expect([fromRef.value, fromGetter.value]).toEqual([false, false]);
  });

  it('filters a list by policy and keeps what declares none', () => {
    const { permission } = permissions({ A: true });

    expect(
      permission.filterByPolicy([
        { name: 'allowed', requiredPolicy: 'A' },
        { name: 'denied', requiredPolicy: 'B' },
        { name: 'open' },
      ]),
    ).toEqual([{ name: 'allowed', requiredPolicy: 'A' }, { name: 'open' }]);
  });

  it('the same expression is parsed once', () => {
    const { permission } = permissions({ A: true });
    const parse = vi.spyOn(console, 'warn').mockImplementation(() => {});

    for (let i = 0; i < 5; i++) permission.isGranted('bad &&');

    expect(parse).toHaveBeenCalledOnce();
    parse.mockRestore();
  });
});
