import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { IdentityUserService, type IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserDetailsDialog from './UserDetailsDialog.vue';

const USER: IdentityUserDto = {
  id: 'user-a',
  userName: 'sample',
  name: '<b>Plain name</b>',
  email: 'sample@example.test',
  emailConfirmed: true,
  phoneNumberConfirmed: false,
  supportTwoFactor: false,
  twoFactorEnabled: false,
  isActive: true,
  lockoutEnabled: true,
  isLockedOut: false,
  shouldChangePasswordOnNextLogin: true,
  accessFailedCount: 0,
  isExternal: false,
  roleNames: ['direct', 'inherited'],
  creatorId: 'audit',
  lastModifierId: 'audit',
  creationTime: new Date(2030, 0, 2, 13, 4).toISOString(),
  lockoutEnd: new Date(Date.now() + 86_400_000).toISOString(),
};
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
});

function apiWith(user = USER) {
  return {
    get: vi.fn<IdentityUserService['get']>(() => Promise.resolve(user)),
    findById: vi.fn<IdentityUserService['findById']>(() =>
      Promise.resolve({ ...USER, id: 'audit', userName: 'creator' }),
    ),
    getOrganizationUnits: vi.fn<IdentityUserService['getOrganizationUnits']>(() =>
      Promise.resolve([{ id: 'child', parentId: 'root', displayName: 'Assigned child' }]),
    ),
    getAvailableOrganizationUnits: vi.fn<IdentityUserService['getAvailableOrganizationUnits']>(() =>
      Promise.resolve({
        items: [
          { id: 'root', displayName: 'Available root', userCount: 1 },
          { id: 'child', parentId: 'root', displayName: 'Assigned child', userCount: 1 },
        ],
      }),
    ),
  };
}

async function dialog(api = apiWith(), granted = true) {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: IdentityUserService, useValue: api },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    auth: {
      grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.ViewDetails': granted },
    },
    currentUser: { ...state.currentUser, id: 'operator', isAuthenticated: true },
    localization: {
      ...state.localization,
      currentCulture: {
        isRightToLeft: false,
        cultureName: 'en-US',
        dateTimeFormat: { shortDatePattern: 'yyyy/MM/dd', shortTimePattern: 'HH:mm' },
      },
      resources: {
        ...state.localization.resources,
        AbpIdentity: { baseResources: [], texts: { Dash: '-', ViewDetails: 'View details' } },
      },
    },
  });
  const wrapper = mount(UserDetailsDialog, {
    attachTo: document.body,
    props: { userId: 'user-a' },
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, api, config };
}

async function tab(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('[role="tab"]').find(item => item.text().includes(label));
  if (!button) throw new TypeError(`The ${label} details tab is missing.`);
  await button.trigger('click');
}

function value(wrapper: VueWrapper, label: string) {
  const row = wrapper.findAll('tr').find(row => row.find('th').text() === label);
  if (!row) throw new TypeError(`The ${label} detail is missing.`);
  return row.get('td').text();
}

describe('commercial user details dialog', () => {
  it('displays all information fields as plain read-only text including confirmation states', async () => {
    const { wrapper } = await dialog();
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3);
    expect(wrapper.findAll('tr')).toHaveLength(10);
    expect(value(wrapper, 'DisplayName:UserId')).toBe('user-a');
    expect(value(wrapper, 'UserName')).toBe('sample');
    expect(value(wrapper, 'Name')).toBe('<b>Plain name</b>');
    expect(wrapper.find('b').exists()).toBe(false);
    expect(value(wrapper, 'Surname')).toBe('-');
    expect(value(wrapper, 'EmailAddress')).toBe('sample@example.test');
    expect(value(wrapper, 'Roles')).toBe('direct, inherited');
    expect(value(wrapper, 'PhoneNumber')).toBe('-');
    expect(value(wrapper, 'DisplayName:EmailConfirmed')).toBe('Yes');
    expect(value(wrapper, 'DisplayName:PhoneNumberConfirmed')).toBe('No');
    expect(value(wrapper, 'DisplayName:IsActive')).toBe('Yes');
    expect(wrapper.find('input:not([type="checkbox"])').exists()).toBe(false);
    expect(wrapper.findAll('button').map(button => button.text())).not.toContain('Save');
  });

  it('shows the expanded organization hierarchy with checked membership and disabled independent boxes', async () => {
    const { wrapper } = await dialog();
    await tab(wrapper, 'OrganizationUnits');
    expect(wrapper.find('[role="tab"][aria-selected="true"]').text()).toContain('(1)');
    const checks = wrapper.findAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checks).toHaveLength(2);
    expect(checks.every(box => box.element.disabled)).toBe(true);
    expect(checks.map(box => box.element.checked)).toEqual([false, true]);
    expect(wrapper.findAll('ul ul')).toHaveLength(1);
  });

  it('shows all general audit and security details, keeping zero and compensating the future lock end', async () => {
    const { wrapper, api } = await dialog();
    await tab(wrapper, 'General');
    expect(wrapper.findAll('tr')).toHaveLength(11);
    expect(value(wrapper, 'CreatedBy')).toBe('creator');
    expect(value(wrapper, 'ModifiedBy')).toBe('creator');
    expect(value(wrapper, 'CreationTime')).toBe('2030/01/02 13:04');
    expect(value(wrapper, 'ModificationTime')).toBe('-');
    expect(value(wrapper, 'PasswordUpdateTime')).toBe('-');
    expect(value(wrapper, 'LockoutEndTime')).not.toBe('-');
    expect(value(wrapper, 'FailedAccessCount')).toBe('0');
    expect(value(wrapper, 'DisplayName:LockoutEnabled')).toBe('Yes');
    expect(value(wrapper, 'Lock')).toBe('Yes');
    expect(value(wrapper, 'IsExternal')).toBe('No');
    expect(value(wrapper, 'DisplayName:ShouldChangePasswordOnNextLogin')).toBe('Yes');
    expect(api.findById).toHaveBeenCalledOnce();
  });

  it('shows missing audit users, missing roles and no memberships without inventing data', async () => {
    const api = apiWith({ ...USER, roleNames: [] });
    api.findById.mockResolvedValue(undefined as unknown as IdentityUserDto);
    api.getOrganizationUnits.mockResolvedValue([]);
    const { wrapper } = await dialog(api);
    expect(value(wrapper, 'Roles')).toBe('-');
    await tab(wrapper, 'General');
    expect(value(wrapper, 'CreatedBy')).toBe('-');
    await tab(wrapper, 'OrganizationUnits');
    expect(wrapper.text()).toContain('NoOrganizationUnits');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
  });

  it('retains visible failures and refreshes all details after a relation read fails', async () => {
    const api = apiWith();
    api.getOrganizationUnits.mockRejectedValueOnce(new TypeError('Organization units unavailable'));
    const { wrapper } = await dialog(api);
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    expect(wrapper.find('[role="tab"]').exists()).toBe(false);
    const retry = wrapper.findAll('button').find(button => button.text() === 'Refresh');
    if (!retry) throw new TypeError('The refresh action is missing.');
    await retry.trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('sample@example.test');
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('resets the selected tab and reads a changed target instead of retaining the prior record', async () => {
    const { wrapper, api } = await dialog();
    await tab(wrapper, 'General');
    api.get.mockResolvedValueOnce({ ...USER, id: 'user-b', userName: 'replacement' });
    await wrapper.setProps({ userId: 'user-b' });
    await flushPromises();
    expect(wrapper.find('[role="tab"][aria-selected="true"]').text()).toBe('UserInformations');
    expect(value(wrapper, 'UserName')).toBe('replacement');
  });

  it('closes and cancels when permissions or tenant context changes', async () => {
    const { wrapper, api, config } = await dialog();
    const signal = api.get.mock.calls[0]?.[1]?.signal;
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await flushPromises();
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(signal?.aborted).toBe(true);

    const other = await dialog();
    const state = other.config.snapshot();
    other.config.setState({
      ...state,
      currentTenant: { ...state.currentTenant, id: 'new-tenant' },
    });
    await flushPromises();
    expect(other.wrapper.emitted('close')).toHaveLength(1);
  });

  it('does not read private details when opened without the view policy', async () => {
    const { wrapper, api } = await dialog(apiWith(), false);
    expect(api.get).not.toHaveBeenCalled();
    expect(api.getOrganizationUnits).not.toHaveBeenCalled();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
