import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  LocalizationService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { IdentityProPolicyNames } from '@lsw-abpvue/identity-pro/config';
import { IdentityRoleService, OrganizationUnitService } from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import RoleUsersDialog from './RoleUsersDialog.vue';
import OrganizationUnitOperationDialog from './OrganizationUnitOperationDialog.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
const record = {
  id: 'record',
  name: 'Example role',
  displayName: 'Example unit',
  code: '00001',
  concurrencyStamp: 'stamp',
  userCount: 1,
};
describe.each(['role-delete', 'role-move', 'unit-delete', 'unit-move', 'unit-move-users'])(
  '%s operation',
  operation => {
    async function setup(failed = false) {
      const mutate = vi.fn(async () => {});
      const get = vi.fn(async () => {
        if (failed) throw new TypeError('Unavailable');
        return record;
      });
      const list = vi.fn(async () => ({ items: [record] }));
      const injector = createInjector([
        ...plainTheme.providers,
        {
          provide: IdentityRoleService,
          useValue: { get, getAllList: list, delete: mutate, moveAllUsers: mutate },
        },
        {
          provide: OrganizationUnitService,
          useValue: { get, getListAll: list, delete: mutate, moveAllUsers: mutate, move: mutate },
        },
      ]);
      injectors.push(injector);
      vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(key => String(key));
      const config = injector.get(ConfigStateService);
      config.refreshAppState = vi.fn(async () => config.snapshot());
      config.setState({
        ...config.snapshot(),
        currentUser: { ...config.snapshot().currentUser, id: 'member', isAuthenticated: true },
        auth: {
          grantedPolicies: Object.fromEntries(
            Object.values(IdentityProPolicyNames).map(policy => [policy, true]),
          ),
        },
      });
      const role = operation.startsWith('role');
      const wrapper = mount(
        (role ? RoleUsersDialog : OrganizationUnitOperationDialog) as Component,
        {
          props: role
            ? { mode: operation.slice(5) as 'delete' | 'move', role: record }
            : { mode: operation.slice(5) as 'delete' | 'move' | 'move-users', unit: record },
          global: {
            provide: { [ABP_INJECTOR_KEY]: injector },
            mocks: { $t: (key: string) => key },
          },
        },
      );
      wrappers.push(wrapper);
      await flushPromises();
      return { wrapper, get, mutate };
    }
    it('loads the current record before offering a destructive operation', async () => {
      const { wrapper, get } = await setup();
      expect(get).toHaveBeenCalled();
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });
    it('completes the selected operation and refreshes authorization', async () => {
      const { wrapper, mutate } = await setup();
      const submit = wrapper
        .findAll('button')
        .find(
          button =>
            button.text() === (operation.endsWith('delete') ? 'AbpUi::Delete' : 'AbpUi::Save'),
        );
      expect(submit).toBeDefined();
      await submit?.trigger('click');
      await flushPromises();
      expect(mutate).toHaveBeenCalled();
      expect(wrapper.emitted('saved')).toHaveLength(1);
    });

    it('shows a retry when fresh record lookup fails', async () => {
      const { wrapper, get } = await setup(true);
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
      await wrapper
        .findAll('button')
        .find(button => button.text().includes('AbpUi::Refresh'))
        ?.trigger('click');
      await flushPromises();
      expect(get.mock.calls.length).toBeGreaterThan(1);
    });
  },
);
