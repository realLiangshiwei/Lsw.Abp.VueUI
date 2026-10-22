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
import UserFindDialog from './UserFindDialog.vue';

const USER: IdentityUserDto = {
  id: '12345678-1234-1234-1234-123456789abc',
  userName: 'user+name',
  email: 'user+tag@example.test',
  emailConfirmed: false,
  phoneNumberConfirmed: false,
  supportTwoFactor: false,
  twoFactorEnabled: false,
  isActive: true,
  lockoutEnabled: true,
  isLockedOut: false,
  shouldChangePasswordOnNextLogin: false,
  accessFailedCount: 0,
  isExternal: false,
};
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
});

function apiWith() {
  return {
    findById: vi.fn<IdentityUserService['findById']>(() => Promise.resolve(USER)),
    findByUsername: vi.fn<IdentityUserService['findByUsername']>(() => Promise.resolve(USER)),
    findByEmail: vi.fn<IdentityUserService['findByEmail']>(() => Promise.resolve(USER)),
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { resolve, promise };
}

async function dialog(api = apiWith(), grants = [true, true]) {
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
      grantedPolicies: {
        'AbpIdentity.Users': grants[0] ?? false,
        'AbpIdentity.Users.ViewDetails': grants[1] ?? false,
      },
    },
    currentUser: { ...state.currentUser, id: 'operator', isAuthenticated: true },
    localization: {
      ...state.localization,
      resources: {
        ...state.localization.resources,
        AbpIdentity: {
          baseResources: [],
          texts: {
            Search: 'Search',
            UserNotFound: 'User is not exist',
            'DisplayName:UserId': 'User id',
            UserName: 'User name',
            EmailAddress: 'Email address',
          },
        },
        AbpUi: {
          baseResources: [],
          texts: { Cancel: 'Cancel', Refresh: 'Refresh', Error: 'Error' },
        },
        AbpValidation: {
          baseResources: [],
          texts: { 'ThisFieldIsRequired.': 'ThisFieldIsRequired.' },
        },
      },
    },
  });
  const wrapper = mount(UserFindDialog, {
    attachTo: document.body,
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, api, config };
}

async function search(wrapper: VueWrapper, mode: string, value: string) {
  await wrapper.get('select[name="findBy"]').setValue(mode);
  await wrapper.get('input[name="findValue"]').setValue(value);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
}

describe('administrative user search dialog', () => {
  it('offers three administrative search modes with accessible labels and no write action', async () => {
    const { wrapper, api } = await dialog();
    expect(
      wrapper
        .get('select[name="findBy"]')
        .findAll('option')
        .map(option => option.text()),
    ).toEqual(['User id', 'User name', 'Email address']);
    const input = wrapper.get('input[name="findValue"]');
    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toContain('User id');
    expect(wrapper.findAll('button').map(button => button.text())).toContain('Search');
    expect(wrapper.findAll('button').map(button => button.text())).not.toContain('Save');
    expect(wrapper.emitted('close')).toBeUndefined();
    expect(api.findById).not.toHaveBeenCalled();
  });

  it('validates required, invalid ids and dot segments before making any request', async () => {
    const { wrapper, api } = await dialog();
    await wrapper.get('form').trigger('submit');
    expect(wrapper.text()).toContain('ThisFieldIsRequired.');
    await search(wrapper, 'id', 'not-a-guid');
    expect(wrapper.text()).toContain('ThisFieldIsNotValid.');
    await search(wrapper, 'userName', '..');
    expect(wrapper.text()).toContain('ThisFieldIsNotValid.');
    expect(api.findById).not.toHaveBeenCalled();
    expect(api.findByUsername).not.toHaveBeenCalled();
  });

  it.each(['id', 'userName', 'email'] as const)(
    'finds by %s and emits only the id for a fresh detail read',
    async mode => {
      const { wrapper, api } = await dialog();
      const value = USER[mode] ?? '';
      await search(wrapper, mode, mode === 'id' ? ` ${value} ` : value);
      expect(wrapper.emitted('found')).toEqual([[USER.id]]);
      expect(wrapper.text()).not.toContain(USER.email);
      const method =
        mode === 'id' ? 'findById' : mode === 'userName' ? 'findByUsername' : 'findByEmail';
      expect(api[method].mock.calls[0]?.[0]).toBe(value);
    },
  );

  it('preserves leading and trailing name spaces and clears not-found after input changes', async () => {
    const api = apiWith();
    api.findByUsername.mockResolvedValueOnce(undefined as unknown as IdentityUserDto);
    const { wrapper } = await dialog(api);
    await search(wrapper, 'userName', ' user+name ');
    expect(api.findByUsername.mock.calls[0]?.[0]).toBe(' user+name ');
    expect(wrapper.get('[role="status"]').text()).toBe('User is not exist');
    expect(wrapper.emitted('found')).toBeUndefined();
    expect(wrapper.get<HTMLInputElement>('input[name="findValue"]').element.value).toBe(
      ' user+name ',
    );
    await wrapper.get('input[name="findValue"]').setValue('different');
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it('keeps transport failures visible and retries without losing the entered identifier', async () => {
    const api = apiWith();
    api.findByEmail.mockRejectedValueOnce(new TypeError('Search unavailable'));
    const { wrapper } = await dialog(api);
    await search(wrapper, 'email', USER.email ?? '');
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    expect(wrapper.get<HTMLInputElement>('input[name="findValue"]').element.value).toBe(USER.email);
    const refresh = wrapper.findAll('button').find(button => button.text() === 'Refresh');
    if (!refresh) throw new TypeError('The refresh action is missing.');
    await refresh.trigger('click');
    await flushPromises();
    expect(api.findByEmail).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('found')).toEqual([[USER.id]]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('uses the official request failure key without a server envelope', async () => {
    const api = apiWith();
    api.findById.mockRejectedValueOnce(undefined);
    const { wrapper } = await dialog(api);
    await search(wrapper, 'id', USER.id ?? '');
    expect(wrapper.get('[role="alert"]').text()).toContain('Error');
  });

  it.each(['input', 'mode'] as const)(
    'cancels the previous query after the %s changes and never emits its late result',
    async changed => {
      const api = apiWith();
      const pending = deferred<IdentityUserDto>();
      api.findByUsername.mockReturnValueOnce(pending.promise);
      const { wrapper } = await dialog(api);
      await search(wrapper, 'userName', USER.userName ?? '');
      await wrapper.get('form').trigger('submit');
      expect(api.findByUsername).toHaveBeenCalledOnce();
      if (changed === 'input') await wrapper.get('input[name="findValue"]').setValue('replacement');
      else await wrapper.get('select[name="findBy"]').setValue('email');
      expect(api.findByUsername.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
      pending.resolve(USER);
      await flushPromises();
      expect(wrapper.emitted('found')).toBeUndefined();
      expect(wrapper.find('[role="status"]').exists()).toBe(false);
    },
  );

  it.each(['Cancel', 'Escape'] as const)(
    'cancels immediately on %s even before the parent unmounts the dialog',
    async action => {
      const api = apiWith();
      const pending = deferred<IdentityUserDto>();
      api.findById.mockReturnValueOnce(pending.promise);
      const { wrapper } = await dialog(api);
      await search(wrapper, 'id', USER.id ?? '');
      if (action === 'Cancel') {
        const cancel = wrapper.findAll('button').find(button => button.text() === 'Cancel');
        if (!cancel) throw new TypeError('The cancel action is missing.');
        await cancel.trigger('click');
      } else await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' });
      expect(api.findById.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
      expect(wrapper.emitted('close')).toHaveLength(1);
      pending.resolve(USER);
      await flushPromises();
      expect(wrapper.emitted('found')).toBeUndefined();
    },
  );

  it.each([
    [true, false],
    [false, true],
  ])('closes without querying when either required policy is absent: %j', async (...grants) => {
    const { wrapper, api } = await dialog(apiWith(), grants);
    await search(wrapper, 'id', USER.id ?? '');
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(api.findById).not.toHaveBeenCalled();
  });

  it.each(['permission', 'tenant', 'user', 'sharing'] as const)(
    'closes, cancels and discards results when %s changes',
    async changed => {
      const api = apiWith();
      const pending = deferred<IdentityUserDto>();
      api.findById.mockReturnValueOnce(pending.promise);
      const { wrapper, config } = await dialog(api);
      await search(wrapper, 'id', USER.id ?? '');
      const state = config.snapshot();
      config.setState({
        ...state,
        ...(changed === 'permission' ? { auth: { grantedPolicies: {} } } : {}),
        ...(changed === 'tenant'
          ? { currentTenant: { ...state.currentTenant, id: 'new-tenant' } }
          : {}),
        ...(changed === 'user' ? { currentUser: { ...state.currentUser, id: 'new-user' } } : {}),
        ...(changed === 'sharing'
          ? { multiTenancy: { ...state.multiTenancy, userSharingStrategy: 1 } }
          : {}),
      });
      expect(api.findById.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
      pending.resolve(USER);
      await flushPromises();
      expect(wrapper.emitted('close')).toHaveLength(1);
      expect(wrapper.emitted('found')).toBeUndefined();
    },
  );
});
