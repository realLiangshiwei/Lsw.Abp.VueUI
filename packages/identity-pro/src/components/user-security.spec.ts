import {
  ABP_INJECTOR_KEY,
  AbpHttpError,
  ConfigStateService,
  createInjector,
  HttpErrorReporterService,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { identityProExtensionsResolver } from '../resolvers/extensions.resolver.js';
import {
  IdentityUserService,
  type IdentityUserDto as IdentityProUserDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserSecurityOperation } from '../models/user-security.js';
import { provideIdentityPro } from '../providers/identity-pro.provider.js';
import UserSecurityDialog from './UserSecurityDialog.vue';
import RemoveUserFromTenantDialog from './RemoveUserFromTenantDialog.vue';
import UsersPage from './UsersPage.vue';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';

const USER: IdentityProUserDto = {
  id: 'user-2',
  userName: 'john',
  email: 'john@example.org',
  emailConfirmed: true,
  phoneNumberConfirmed: false,
  supportTwoFactor: true,
  twoFactorEnabled: false,
  isActive: true,
  lockoutEnabled: true,
  isLockedOut: false,
  shouldChangePasswordOnNextLogin: false,
  isExternal: false,
  accessFailedCount: 0,
};
const WRITE_POLICIES = ['AbpIdentity.Users', 'AbpIdentity.Users.Update'];
const mounted: VueWrapper[] = [];
const injectors: Injector[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
});

function apiWith(user: IdentityProUserDto = USER) {
  return {
    get: vi.fn<IdentityUserService['get']>(() => Promise.resolve(user)),
    getTwoFactorEnabled: vi.fn<IdentityUserService['getTwoFactorEnabled']>(() =>
      Promise.resolve(user.twoFactorEnabled),
    ),
    lock: vi.fn(() => Promise.resolve()),
    unlock: vi.fn(() => Promise.resolve()),
    updatePassword: vi.fn(() => Promise.resolve()),
    setTwoFactorEnabled: vi.fn(() => Promise.resolve()),
  };
}

function environment(
  api: ReturnType<typeof apiWith>,
  policies = WRITE_POLICIES,
  providers: ProviderInput[] = [],
): Injector {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: IdentityUserService, useValue: api },
    ...providers,
  ]);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    auth: { grantedPolicies: Object.fromEntries(policies.map(name => [name, true])) },
    currentUser: { ...state.currentUser, id: 'admin', isAuthenticated: true, userName: 'admin' },
    features: {
      ...state.features,
      values: { ...state.features.values, 'Identity.TwoFactor': 'Optional' },
    },
    setting: {
      ...state.setting,
      values: { ...state.setting.values, 'Abp.Identity.TwoFactor.Behaviour': 'Optional' },
    },
  });
  injectors.push(injector);
  return injector;
}

const mountOptions = (injector: Injector) => ({
  attachTo: document.body,
  global: {
    provide: { [ABP_INJECTOR_KEY]: injector },
    mocks: { $t: (key: string) => key },
    stubs: { RouterLink: true },
  },
});

async function dialog(
  operation: UserSecurityOperation,
  api = apiWith(),
  policies = WRITE_POLICIES,
  user: IdentityProUserDto = USER,
) {
  const injector = environment(api, policies);
  const wrapper = mount(UserSecurityDialog, {
    ...mountOptions(injector),
    props: { operation, user },
  });
  mounted.push(wrapper);
  await flushPromises();
  return { wrapper, api, injector };
}

const buttonSaying = (wrapper: VueWrapper, text: string) => {
  const found = wrapper.findAll('button').find(button => button.text() === text);
  if (!found) throw new Error(`The ${text} button is missing.`);
  return found;
};

async function fillPassword(wrapper: VueWrapper, password = 'Strong1!') {
  await wrapper.get('input[name="newPassword"]').setValue(password);
  await wrapper.get('input[name="newPasswordConfirm"]').setValue(password);
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('commercial user security dialog', () => {
  it.each(['authentication', 'password policy'] as const)(
    'rejects an obsolete password submission after its %s changes',
    async change => {
      const { wrapper, injector, api } = await dialog('password');
      await fillPassword(wrapper);
      const config = injector.get(ConfigStateService);
      const current = config.snapshot();
      config.setState(
        change === 'authentication'
          ? { ...current, currentUser: { ...current.currentUser, isAuthenticated: false } }
          : {
              ...current,
              setting: {
                values: { ...current.setting.values, 'Abp.Identity.Password.RequiredLength': '20' },
              },
            },
      );
      await flushPromises();
      if (change === 'authentication') expect(wrapper.emitted('close')).toHaveLength(1);
      else expect(wrapper.emitted('close')).toBeUndefined();
      await buttonSaying(wrapper, 'Save').trigger('click');
      expect(api.updatePassword).not.toHaveBeenCalled();
    },
  );
  it('fills a generated password and its confirmation using the current runtime policy', async () => {
    const { wrapper, injector, api } = await dialog('password');
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      setting: {
        values: {
          ...config.snapshot().setting.values,
          'Abp.Identity.Password.RequiredLength': '32',
          'Abp.Identity.Password.RequiredUniqueChars': '32',
        },
      },
    });
    await buttonSaying(wrapper, 'GenerateRandomPassword').trigger('click');
    const password = wrapper.get<HTMLInputElement>('input[name="newPassword"]').element.value;
    expect(password.length).toBe(32);
    expect(new Set(password).size).toBeGreaterThanOrEqual(32);
    expect(wrapper.get<HTMLInputElement>('input[name="newPasswordConfirm"]').element.value).toBe(
      password,
    );
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.updatePassword).toHaveBeenCalledExactlyOnceWith('user-2', { newPassword: password });
  });
  it.each(['lock', 'unlock', 'two-factor'] as const)(
    'blocks %s submissions in a shared tenant even when the dialog was already open',
    async operation => {
      const { wrapper, api, injector } = await dialog(operation);
      const state = injector.get(ConfigStateService).snapshot();
      injector.get(ConfigStateService).setState({
        ...state,
        multiTenancy: { ...state.multiTenancy, userSharingStrategy: 1 },
        currentTenant: { ...state.currentTenant, id: 'tenant-a', isAvailable: true },
      });
      await flushPromises();
      await wrapper.get('form').trigger('submit');
      expect(wrapper.findAll('button').map(button => button.text())).not.toContain('Save');
      expect(api.lock).not.toHaveBeenCalled();
      expect(api.unlock).not.toHaveBeenCalled();
      expect(api.setTwoFactorEnabled).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['Forced', 'Optional'],
    ['Optional', 'Disabled'],
    ['0', 'Optional'],
  ])('blocks a two factor change when feature=%s and setting=%s', async (feature, setting) => {
    const { wrapper, api, injector } = await dialog('two-factor');
    const state = injector.get(ConfigStateService).snapshot();
    injector.get(ConfigStateService).setState({
      ...state,
      features: {
        ...state.features,
        values: { ...state.features.values, 'Identity.TwoFactor': feature },
      },
      setting: {
        ...state.setting,
        values: { ...state.setting.values, 'Abp.Identity.TwoFactor.Behaviour': setting },
      },
    });
    await flushPromises();
    await wrapper.get('form').trigger('submit');
    expect(wrapper.findAll('button').map(button => button.text())).not.toContain('Save');
    expect(api.setTwoFactorEnabled).not.toHaveBeenCalled();
  });

  it('lets an administrator change the end of an existing lock', async () => {
    const { wrapper, api } = await dialog('lock', apiWith({ ...USER, isLockedOut: true }));
    const end = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    await wrapper.get('input[name="lockoutEnd"]').setValue(end);
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.lock).toHaveBeenCalledExactlyOnceWith('user-2', new Date(end).toISOString());
  });

  it('requires the configured password complexity and matching confirmation before saving', async () => {
    const { wrapper, api } = await dialog('password');
    await fillPassword(wrapper, 'weak');
    await buttonSaying(wrapper, 'Save').trigger('click');
    expect(api.updatePassword).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('PasswordRequiresDigit');

    await fillPassword(wrapper);
    await wrapper.get('input[name="newPasswordConfirm"]').setValue('Different1!');
    await buttonSaying(wrapper, 'Save').trigger('click');
    expect(api.updatePassword).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('PasswordsAreNotSame');

    await wrapper.get('input[name="newPasswordConfirm"]').setValue('Strong1!');
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.updatePassword).toHaveBeenCalledExactlyOnceWith('user-2', {
      newPassword: 'Strong1!',
    });
    expect(wrapper.emitted('saved')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('requires a future lockout end and sends its ISO timestamp', async () => {
    const { wrapper, api } = await dialog('lock');
    await buttonSaying(wrapper, 'Save').trigger('click');
    expect(api.lock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('ThisFieldIsRequired.');

    await wrapper.get('input[name="lockoutEnd"]').setValue('2000-01-01T12:00');
    await buttonSaying(wrapper, 'Save').trigger('click');
    expect(api.lock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('ThisFieldMustBeGreaterThanOrEqual');

    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    await wrapper.get('input[name="lockoutEnd"]').setValue(future);
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.lock).toHaveBeenCalledExactlyOnceWith('user-2', new Date(future).toISOString());
  });

  it('uses the same local clock for the lockout bound and the saved UTC instant', async () => {
    vi.stubEnv('TZ', 'Asia/Shanghai');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-02T08:30:00+08:00'));

    try {
      const { wrapper, api } = await dialog('lock');
      const input = wrapper.get('input[name="lockoutEnd"]');
      expect(input.attributes('min')).toBe('2030-01-02T08:30:00.000');
      await input.setValue('2030-01-02T09:30');
      await buttonSaying(wrapper, 'Save').trigger('click');
      await flushPromises();
      expect(api.lock).toHaveBeenCalledExactlyOnceWith('user-2', '2030-01-02T01:30:00.000Z');
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    }
  });

  it.each([
    { operation: 'lock' as const, changes: { id: 'admin' } },
    { operation: 'lock' as const, changes: { lockoutEnabled: false } },
  ])(
    'refuses unavailable $operation operations after reading the current user',
    async ({ operation, changes }) => {
      const api = apiWith({ ...USER, ...changes });
      const { wrapper } = await dialog(operation, api);
      expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeDefined();
      await buttonSaying(wrapper, 'Save').trigger('click');
      expect(api.lock).not.toHaveBeenCalled();
      expect(api.updatePassword).not.toHaveBeenCalled();
    },
  );

  it('allows an administrator to assign a local password to an external user', async () => {
    const { wrapper, api } = await dialog('password', apiWith({ ...USER, isExternal: true }));
    await fillPassword(wrapper);
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.updatePassword).toHaveBeenCalledExactlyOnceWith('user-2', {
      newPassword: 'Strong1!',
    });
  });

  it('refuses security details returned for a different user than the selected target', async () => {
    const api = apiWith({ ...USER, id: 'another-user', userName: 'another' });
    const { wrapper } = await dialog('password', api);
    await fillPassword(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(api.updatePassword).not.toHaveBeenCalled();
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeDefined();
    expect(buttonSaying(wrapper, 'Refresh').exists()).toBe(true);
    expect(wrapper.emitted('saved')).toBeUndefined();
  });

  it('rejects a manual password longer than the backend maximum of 128 characters', async () => {
    const { wrapper, api } = await dialog('password');
    await fillPassword(wrapper, `Strong1!${'a'.repeat(121)}`);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(api.updatePassword).not.toHaveBeenCalled();
    expect(wrapper.emitted('saved')).toBeUndefined();
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('preserves the entered password and requires a successful fresh read before retrying an uncertain write', async () => {
    const api = apiWith();
    api.updatePassword.mockRejectedValueOnce(new Error('Rejected by the test service'));
    const { wrapper } = await dialog('password', api);
    await fillPassword(wrapper);
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(wrapper.get<HTMLInputElement>('input[name="newPassword"]').element.value).toBe(
      'Strong1!',
    );
    expect(wrapper.emitted('close')).toBeUndefined();
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeDefined();
    await wrapper.get('form').trigger('submit');
    expect(api.updatePassword).toHaveBeenCalledTimes(1);
    api.get.mockRejectedValueOnce(new Error('Still unavailable'));
    await buttonSaying(wrapper, 'Refresh').trigger('click');
    await flushPromises();
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeDefined();
    await buttonSaying(wrapper, 'Refresh').trigger('click');
    await flushPromises();
    expect(wrapper.get<HTMLInputElement>('input[name="newPassword"]').element.value).toBe(
      'Strong1!',
    );
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeUndefined();
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.updatePassword).toHaveBeenCalledTimes(2);
  });

  it.each(['lock', 'unlock', 'password', 'two-factor'] as const)(
    'accepts only one pending %s save',
    async operation => {
      const pending = deferred<void>();
      const api = apiWith(operation === 'unlock' ? { ...USER, isLockedOut: true } : USER);
      const command = {
        lock: api.lock,
        unlock: api.unlock,
        password: api.updatePassword,
        'two-factor': api.setTwoFactorEnabled,
      }[operation];
      command.mockReturnValueOnce(pending.promise);
      const { wrapper } = await dialog(operation, api);
      if (operation === 'password') await fillPassword(wrapper);
      if (operation === 'lock') {
        await wrapper
          .get('input[name="lockoutEnd"]')
          .setValue(new Date(Date.now() + 86_400_000).toISOString().slice(0, 16));
      }
      if (operation === 'two-factor') {
        await wrapper.get('input[name="twoFactorEnabled"]').setValue(true);
      }
      await buttonSaying(wrapper, 'Save').trigger('click');
      await buttonSaying(wrapper, 'Save').trigger('click');
      expect(command).toHaveBeenCalledTimes(1);
      expect(buttonSaying(wrapper, 'Cancel').attributes('disabled')).toBeDefined();
      pending.resolve(undefined);
      await flushPromises();
      expect(wrapper.emitted('saved')).toHaveLength(1);
    },
  );

  it('reads two factor status without offering writes to a reader', async () => {
    const api = apiWith({ ...USER, twoFactorEnabled: true });
    const { wrapper } = await dialog('two-factor', api, ['AbpIdentity.Users']);
    expect(api.getTwoFactorEnabled).toHaveBeenCalledWith('user-2', {
      signal: expect.any(AbortSignal),
      skipHandleError: true,
    });
    expect(api.get).toHaveBeenCalledWith('user-2', {
      signal: expect.any(AbortSignal),
      skipHandleError: true,
    });
    expect(wrapper.get<HTMLInputElement>('input[name="twoFactorEnabled"]').element.checked).toBe(
      true,
    );
    expect(wrapper.get<HTMLInputElement>('input[name="twoFactorEnabled"]').element.disabled).toBe(
      true,
    );
    expect(wrapper.findAll('button').map(button => button.text())).not.toContain('Save');
  });

  it('prevents enabling two factor when the user has no supported provider', async () => {
    const { wrapper, api } = await dialog(
      'two-factor',
      apiWith({ ...USER, supportTwoFactor: false }),
    );
    expect(wrapper.text()).toContain('YouCanNotEnableTwoFactorForThisUser');
    expect(wrapper.get<HTMLInputElement>('input[name="twoFactorEnabled"]').element.disabled).toBe(
      true,
    );
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeDefined();
    expect(api.setTwoFactorEnabled).not.toHaveBeenCalled();
  });

  it('lets an enabled user disable two factor after providers are removed', async () => {
    const { wrapper, api } = await dialog(
      'two-factor',
      apiWith({
        ...USER,
        supportTwoFactor: false,
        twoFactorEnabled: true,
      }),
    );
    await wrapper.get('input[name="twoFactorEnabled"]').setValue(false);
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.setTwoFactorEnabled).toHaveBeenCalledExactlyOnceWith('user-2', false);
  });

  it('ignores a late response from the previously selected user', async () => {
    const old = deferred<IdentityProUserDto>();
    const fresh = deferred<IdentityProUserDto>();
    const api = apiWith();
    api.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    const { wrapper } = await dialog('password', api);
    await wrapper.setProps({ user: { ...USER, id: 'user-3', userName: 'jane' } });
    fresh.resolve({ ...USER, id: 'user-3' });
    await flushPromises();
    old.resolve({ ...USER, isExternal: true });
    await flushPromises();
    await fillPassword(wrapper);
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(api.updatePassword).toHaveBeenCalledExactlyOnceWith('user-3', {
      newPassword: 'Strong1!',
    });
  });

  it('keeps saving unavailable when current security details could not be read', async () => {
    const api = apiWith();
    api.get.mockRejectedValueOnce(new Error('User could not be read'));
    const { wrapper } = await dialog('password', api);
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeDefined();
    expect(api.updatePassword).not.toHaveBeenCalled();
    await buttonSaying(wrapper, 'Refresh').trigger('click');
    await flushPromises();
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeUndefined();
  });

  it('reports a failed current security lookup through the public error reporter', async () => {
    const pending = deferred<IdentityProUserDto>();
    const api = apiWith();
    api.get.mockReturnValueOnce(pending.promise);
    const { wrapper, injector } = await dialog('password', api);
    const report = vi.fn();
    injector.get(HttpErrorReporterService).onError(report);
    const failure = new AbpHttpError({
      status: 0,
      statusText: '',
      method: 'GET',
      url: '/api/identity/users/user-2',
    });

    pending.reject(failure);
    await flushPromises();

    expect(report).toHaveBeenCalledExactlyOnceWith(failure);
    expect(buttonSaying(wrapper, 'Save').attributes('disabled')).toBeDefined();
  });

  it('silences a failed lookup after another user supersedes its selection', async () => {
    const pending = deferred<IdentityProUserDto>();
    const api = apiWith();
    api.get.mockReturnValueOnce(pending.promise);
    const { wrapper, injector } = await dialog('password', api);
    const report = vi.fn();
    injector.get(HttpErrorReporterService).onError(report);
    await wrapper.setProps({ user: { ...USER, id: 'user-3', userName: 'jane' } });

    pending.reject(
      new AbpHttpError({
        status: 0,
        statusText: '',
        method: 'GET',
        url: '/api/identity/users/user-2',
      }),
    );
    await flushPromises();

    expect(api.get.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(report).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('jane');
  });

  it('silences an aborted lookup when the user closes the dialog', async () => {
    const pending = deferred<IdentityProUserDto>();
    const api = apiWith();
    api.get.mockReturnValueOnce(pending.promise);
    const { wrapper, injector } = await dialog('password', api);
    const report = vi.fn();
    injector.get(HttpErrorReporterService).onError(report);
    await buttonSaying(wrapper, 'Cancel').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
    mounted.splice(mounted.indexOf(wrapper), 1);
    pending.reject(
      new AbpHttpError({
        status: 0,
        statusText: '',
        method: 'GET',
        url: '/api/identity/users/user-2',
        raw: new DOMException('The lookup was cancelled', 'AbortError'),
      }),
    );
    await flushPromises();

    expect(api.get.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(report).not.toHaveBeenCalled();
  });
});

describe('commercial user editor write recovery', () => {
  async function userEditor() {
    const api = {
      ...apiWith(),
      getList: vi.fn<IdentityUserService['getList']>(() =>
        Promise.resolve({ items: [USER], totalCount: 1 }),
      ),
      getRoles: vi.fn<IdentityUserService['getRoles']>(() => Promise.resolve({ items: [] })),
      getOrganizationUnits: vi.fn<IdentityUserService['getOrganizationUnits']>(() =>
        Promise.resolve([]),
      ),
      create: vi.fn<IdentityUserService['create']>(() => Promise.resolve(USER)),
      update: vi.fn<IdentityUserService['update']>(() => Promise.resolve(USER)),
      delete: vi.fn<IdentityUserService['delete']>(() => Promise.resolve()),
    };
    const injector = environment(
      api,
      [...WRITE_POLICIES, 'AbpIdentity.Users.Create', 'AbpIdentity.Users.Delete'],
      [...provideIdentityPro(), { provide: IdentityUserService, useValue: api }],
    );
    injector.runInContext(identityProExtensionsResolver);
    const wrapper = mount(UsersPage, mountOptions(injector));
    mounted.push(wrapper);
    await flushPromises();
    return {
      wrapper,
      api,
      injector,
      config: injector.get(ConfigStateService),
      confirmation: injector.get(ConfirmationService),
    };
  }
  async function clickEditor(wrapper: VueWrapper, suffix: string) {
    const button = wrapper.findAll('button').find(item => item.text().endsWith(suffix));
    if (!button) throw new TypeError(`The ${suffix} editor action is unavailable.`);
    await button.trigger('click');
    await flushPromises();
  }

  async function createDraft(wrapper: VueWrapper) {
    await clickEditor(wrapper, 'NewUser');
    await wrapper.get('input[name="userName"]').setValue('new-user');
    await wrapper.get('input[name="email"]').setValue('new-user@example.org');
    await wrapper.get('input[name="password"]').setValue('Strong1!');
  }

  it.each(['tenant', 'authentication'] as const)(
    'does not delete using an old confirmation after its %s context changes and returns',
    async reason => {
      const { wrapper, api, config, confirmation } = await userEditor();
      const answer = deferred<ConfirmationStatus>();
      vi.spyOn(confirmation, 'warn').mockReturnValueOnce(answer.promise);
      await clickEditor(wrapper, 'Delete');
      const initial = config.snapshot();
      if (reason === 'tenant')
        config.setState({ ...initial, currentTenant: { id: 'new-tenant', isAvailable: true } });
      else
        config.setState({
          ...initial,
          currentUser: { ...initial.currentUser, isAuthenticated: false },
        });
      config.setState(initial);
      await flushPromises();
      answer.resolve(ConfirmationStatus.confirm);
      await flushPromises();
      expect(api.delete).not.toHaveBeenCalled();
    },
  );

  it('requires the fresh deletion detail to match the selected user identifier', async () => {
    const { wrapper, api, confirmation } = await userEditor();
    vi.spyOn(confirmation, 'warn').mockResolvedValue(ConfirmationStatus.confirm);
    api.get.mockResolvedValueOnce({ ...USER, id: 'another-user' });
    await clickEditor(wrapper, 'Delete');
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('keeps later deletions usable when an editor is opened while an earlier delete is pending', async () => {
    const { wrapper, api, confirmation } = await userEditor();
    const other = { ...USER, id: 'user-3', userName: 'another-user' };
    api.getList.mockResolvedValue({ items: [USER, other], totalCount: 2 });
    api.get.mockImplementation(id => Promise.resolve(id === other.id ? other : USER));
    await wrapper.get('input[type="search"]').setValue('both');
    await flushPromises();
    await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(2));
    const pending = deferred<void>();
    api.delete.mockReturnValueOnce(pending.promise);
    vi.spyOn(confirmation, 'warn').mockResolvedValue(ConfirmationStatus.confirm);
    await clickEditor(wrapper, 'Delete');
    const row = wrapper
      .findAll('tbody tr')
      .find(item => item.find('[data-column="userName"]').text() === other.userName);
    if (!row) throw new TypeError('The second owned user row is unavailable.');
    const edit = row.findAll('button').find(item => item.text().endsWith('Edit'));
    if (!edit) throw new TypeError('The second user edit action is unavailable.');
    await edit.trigger('click');
    await flushPromises();
    if (wrapper.find('[role="dialog"]').exists()) await clickEditor(wrapper, 'Cancel');
    pending.resolve(undefined);
    await flushPromises();
    const remove = row.findAll('button').find(item => item.text().endsWith('Delete'));
    if (!remove) throw new TypeError('The second user delete action is unavailable.');
    await remove.trigger('click');
    await flushPromises();
    expect(api.delete).toHaveBeenCalledTimes(2);
    expect(api.delete).toHaveBeenLastCalledWith(
      other.id,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('permits an explicit edit retry only after reading fresh server values', async () => {
    const { wrapper, api, confirmation } = await userEditor();
    vi.spyOn(confirmation, 'warn').mockResolvedValue(ConfirmationStatus.confirm);
    api.update.mockRejectedValueOnce(new TypeError('The update response was interrupted.'));
    await clickEditor(wrapper, 'Edit');
    await wrapper.get('input[name="name"]').setValue('Uncertain name');
    await clickEditor(wrapper, 'Save');
    api.get.mockResolvedValue({
      ...USER,
      name: 'Fresh server value',
      concurrencyStamp: 'fresh-after-failure',
    });
    await clickEditor(wrapper, 'Refresh');
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(wrapper.get<HTMLInputElement>('input[name="name"]').element.value).toBe(
      'Fresh server value',
    );
    await wrapper.get('input[name="name"]').setValue('Explicit retry');
    await clickEditor(wrapper, 'Save');
    expect(api.update).toHaveBeenCalledTimes(2);
    expect(api.update).toHaveBeenLastCalledWith(
      USER.id,
      expect.objectContaining({ name: 'Explicit retry', concurrencyStamp: 'fresh-after-failure' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it.each(['confirm', 'cancel', 'exists'] as const)(
    'inspects an uncertain create before the explicit %s outcome',
    async outcome => {
      const { wrapper, api, confirmation } = await userEditor();
      const confirm = vi
        .spyOn(confirmation, 'warn')
        .mockResolvedValue(
          outcome === 'cancel' ? ConfirmationStatus.reject : ConfirmationStatus.confirm,
        );
      api.create.mockRejectedValueOnce(new TypeError('The create response was interrupted.'));
      await createDraft(wrapper);
      await clickEditor(wrapper, 'Save');
      api.getList.mockImplementation(input =>
        Promise.resolve({
          items: input.userName && outcome === 'exists' ? [{ ...USER, userName: 'new-user' }] : [],
          totalCount: 0,
        }),
      );
      await clickEditor(wrapper, 'Refresh');
      expect(api.getList).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'new-user' }),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(wrapper.get<HTMLInputElement>('input[name="userName"]').element.value).toBe(
        'new-user',
      );
      if (outcome === 'exists') expect(confirm).not.toHaveBeenCalled();
      await clickEditor(wrapper, 'Save');
      expect(api.create).toHaveBeenCalledTimes(outcome === 'confirm' ? 2 : 1);
    },
  );

  it('does not let a successful write from an old tenant close the newly opened editor', async () => {
    const { wrapper, api, config } = await userEditor();
    const oldWrite = deferred<IdentityProUserDto>();
    api.update.mockReturnValueOnce(oldWrite.promise);
    await clickEditor(wrapper, 'Edit');
    await wrapper.get('input[name="name"]').setValue('Old tenant edit');
    await clickEditor(wrapper, 'Save');
    config.setState({
      ...config.snapshot(),
      currentTenant: { id: 'new-tenant', isAvailable: true },
    });
    await flushPromises();
    await clickEditor(wrapper, 'Edit');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    await wrapper.get('input[name="name"]').setValue('New tenant draft');
    oldWrite.resolve(USER);
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.get<HTMLInputElement>('input[name="name"]').element.value).toBe(
      'New tenant draft',
    );
  });

  it('does not let an old rejected write release the pending write lock of a new tenant', async () => {
    const { wrapper, api, config } = await userEditor();
    const oldWrite = deferred<IdentityProUserDto>();
    const newWrite = deferred<IdentityProUserDto>();
    api.update.mockReturnValueOnce(oldWrite.promise).mockReturnValueOnce(newWrite.promise);
    await clickEditor(wrapper, 'Edit');
    await wrapper.get('input[name="name"]').setValue('Old tenant edit');
    await clickEditor(wrapper, 'Save');
    config.setState({
      ...config.snapshot(),
      currentTenant: { id: 'new-tenant', isAvailable: true },
    });
    await flushPromises();
    await clickEditor(wrapper, 'Edit');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    await wrapper.get('input[name="name"]').setValue('New tenant edit');
    await clickEditor(wrapper, 'Save');
    oldWrite.reject(new TypeError('The old response failed late.'));
    await flushPromises();
    const save = wrapper.findAll('button').find(item => item.text().endsWith('Save'));
    expect(save?.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).not.toContain('ErrorLoadingDatatable');
    newWrite.resolve(USER);
    await flushPromises();
    expect(api.update).toHaveBeenCalledTimes(2);
  });

  it('releases the old create-inspection lock when its tenant closes, even after its late result arrives', async () => {
    const { wrapper, api, config } = await userEditor();
    api.create.mockRejectedValueOnce(new TypeError('The create response was interrupted.'));
    await createDraft(wrapper);
    await clickEditor(wrapper, 'Save');
    const inspection = deferred<Awaited<ReturnType<IdentityUserService['getList']>>>();
    api.getList.mockImplementation(input =>
      input.userName ? inspection.promise : Promise.resolve({ items: [USER], totalCount: 1 }),
    );
    await clickEditor(wrapper, 'Refresh');
    config.setState({
      ...config.snapshot(),
      currentTenant: { id: 'new-tenant', isAvailable: true },
    });
    await flushPromises();
    inspection.resolve({ items: [], totalCount: 0 });
    await flushPromises();

    await clickEditor(wrapper, 'NewUser');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.get<HTMLInputElement>('input[name="userName"]').element.value).toBe('');
    expect(api.create).toHaveBeenCalledOnce();
  });

  it('does not authorize a changed create draft using the outcome inspection of its previous payload', async () => {
    const { wrapper, api, confirmation } = await userEditor();
    vi.spyOn(confirmation, 'warn').mockResolvedValue(ConfirmationStatus.confirm);
    api.create.mockRejectedValueOnce(new TypeError('The create response was interrupted.'));
    await createDraft(wrapper);
    await clickEditor(wrapper, 'Save');
    const inspection = deferred<Awaited<ReturnType<IdentityUserService['getList']>>>();
    api.getList.mockImplementation(input =>
      input.userName ? inspection.promise : Promise.resolve({ items: [USER], totalCount: 1 }),
    );
    await clickEditor(wrapper, 'Refresh');
    await wrapper.get('input[name="userName"]').setValue('different-user');
    inspection.resolve({ items: [], totalCount: 0 });
    await flushPromises();
    await clickEditor(wrapper, 'Save');
    expect(api.create).toHaveBeenCalledOnce();
    const save = wrapper.findAll('button').find(item => item.text().endsWith('Save'));
    expect(save?.attributes('disabled')).toBeDefined();
  });

  it('retains edit input and blocks replay of an uncertain user update until explicit recovery', async () => {
    const { wrapper, api } = await userEditor();
    api.update.mockRejectedValueOnce(new TypeError('The update response was interrupted.'));
    await clickEditor(wrapper, 'Edit');
    await wrapper.get('input[name="name"]').setValue('Retained name');
    await clickEditor(wrapper, 'Save');
    expect(wrapper.get<HTMLInputElement>('input[name="name"]').element.value).toBe('Retained name');
    await clickEditor(wrapper, 'Save');
    expect(api.update).toHaveBeenCalledOnce();
    const save = wrapper.findAll('button').find(item => item.text().endsWith('Save'));
    expect(save?.attributes('disabled')).toBeDefined();
  });

  it('retains create input and blocks replay of an uncertain create until explicit recovery', async () => {
    const { wrapper, api } = await userEditor();
    api.create.mockRejectedValueOnce(new TypeError('The create response was interrupted.'));
    await clickEditor(wrapper, 'NewUser');
    await wrapper.get('input[name="userName"]').setValue('new-user');
    await wrapper.get('input[name="email"]').setValue('new-user@example.org');
    await wrapper.get('input[name="password"]').setValue('Strong1!');
    await clickEditor(wrapper, 'Save');
    expect(wrapper.get<HTMLInputElement>('input[name="userName"]').element.value).toBe('new-user');
    expect(api.create).toHaveBeenCalledOnce();
    await clickEditor(wrapper, 'Save');
    expect(api.create).toHaveBeenCalledOnce();
    const save = wrapper.findAll('button').find(item => item.text().endsWith('Save'));
    expect(save?.attributes('disabled')).toBeDefined();
  });

  it('does not replay a successful user update when the following list refresh fails', async () => {
    const { wrapper, api } = await userEditor();
    await clickEditor(wrapper, 'Edit');
    await wrapper.get('input[name="name"]').setValue('Saved name');
    api.getList.mockRejectedValueOnce(new TypeError('The list read failed.'));
    await clickEditor(wrapper, 'Save');
    expect(api.update).toHaveBeenCalledOnce();
    expect(api.getList).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
});

describe('Shared tenant membership removal', () => {
  async function membership(user = USER) {
    const api = { ...apiWith(user), removeFromTenant: vi.fn(() => Promise.resolve()) };
    const injector = environment(api, ['AbpIdentity.Users', 'AbpIdentity.Users.Delete']);
    const config = injector.get(ConfigStateService);
    config.setState({
      ...config.snapshot(),
      currentTenant: { id: 'tenant-a', isAvailable: true },
      multiTenancy: { ...config.snapshot().multiTenancy, userSharingStrategy: 1 },
    });
    const confirmation = injector.get(ConfirmationService);
    vi.spyOn(confirmation, 'warn').mockResolvedValue(ConfirmationStatus.confirm);
    const wrapper = mount(RemoveUserFromTenantDialog, {
      ...mountOptions(injector),
      props: { userId: USER.id ?? 'user-id-missing' },
    });
    mounted.push(wrapper);
    await flushPromises();
    return { wrapper, api, config, confirmation };
  }
  async function removeMember(wrapper: VueWrapper) {
    await buttonSaying(wrapper, 'RemoveFromTenant').trigger('click');
    await flushPromises();
  }

  it('rejects a fresh detail that belongs to another user', async () => {
    const { wrapper, api } = await membership({ ...USER, id: 'other-user' });
    await removeMember(wrapper);
    expect(api.removeFromTenant).not.toHaveBeenCalled();
    expect(buttonSaying(wrapper, 'RemoveFromTenant').attributes('disabled')).toBeDefined();
    expect(buttonSaying(wrapper, 'Refresh').exists()).toBe(true);
  });

  it('requires a successful fresh read before explicitly retrying an uncertain membership write', async () => {
    const { wrapper, api } = await membership();
    api.removeFromTenant.mockRejectedValueOnce(new TypeError('The response was interrupted.'));
    await removeMember(wrapper);
    await removeMember(wrapper);
    expect(api.removeFromTenant).toHaveBeenCalledOnce();
    api.get.mockRejectedValueOnce(new TypeError('The user is unavailable.'));
    await buttonSaying(wrapper, 'Refresh').trigger('click');
    await flushPromises();
    await removeMember(wrapper);
    expect(api.removeFromTenant).toHaveBeenCalledOnce();
    await buttonSaying(wrapper, 'Refresh').trigger('click');
    await flushPromises();
    await removeMember(wrapper);
    expect(api.removeFromTenant).toHaveBeenCalledTimes(2);
  });

  it('treats a source lookup 404 after an uncertain removal as completed membership removal', async () => {
    const { wrapper, api } = await membership();
    api.removeFromTenant.mockRejectedValueOnce(new TypeError('The response was interrupted.'));
    await removeMember(wrapper);
    api.get.mockRejectedValueOnce(
      new AbpHttpError({
        method: 'GET',
        url: '/api/identity/users/user-2',
        status: 404,
        statusText: 'Not Found',
      }),
    );
    await buttonSaying(wrapper, 'Refresh').trigger('click');
    await flushPromises();
    expect(api.removeFromTenant).toHaveBeenCalledOnce();
    expect(wrapper.emitted('saved')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it.each(['tenant', 'permission', 'sharing', 'authentication'] as const)(
    'refuses a pending confirmation after the active %s context changes',
    async reason => {
      const { wrapper, api, config, confirmation } = await membership();
      const answer = deferred<ConfirmationStatus>();
      vi.mocked(confirmation.warn).mockReturnValueOnce(answer.promise);
      await buttonSaying(wrapper, 'RemoveFromTenant').trigger('click');
      const state = config.snapshot();
      if (reason === 'tenant')
        config.setState({ ...state, currentTenant: { id: 'tenant-b', isAvailable: true } });
      else if (reason === 'permission')
        config.setState({ ...state, auth: { grantedPolicies: {} } });
      else if (reason === 'sharing')
        config.setState({
          ...state,
          multiTenancy: { ...state.multiTenancy, userSharingStrategy: 0 },
        });
      else
        config.setState({
          ...state,
          currentUser: { ...state.currentUser, isAuthenticated: false },
        });
      answer.resolve(ConfirmationStatus.confirm);
      await flushPromises();
      expect(api.removeFromTenant).not.toHaveBeenCalled();
      expect(wrapper.emitted('close')).toBeDefined();
    },
  );

  it('accepts only one confirmation and write while removal confirmation is pending', async () => {
    const { wrapper, api, confirmation } = await membership();
    const answer = deferred<ConfirmationStatus>();
    vi.mocked(confirmation.warn).mockReturnValue(answer.promise);
    await buttonSaying(wrapper, 'RemoveFromTenant').trigger('click');
    await buttonSaying(wrapper, 'RemoveFromTenant').trigger('click');
    expect(confirmation.warn).toHaveBeenCalledOnce();
    answer.resolve(ConfirmationStatus.confirm);
    await flushPromises();
    expect(api.removeFromTenant).toHaveBeenCalledOnce();
  });

  it.each(['permission', 'sharing'] as const)(
    'invalidates an old confirmation when %s is lost even if restored before its answer',
    async reason => {
      const { wrapper, api, config, confirmation } = await membership();
      const answer = deferred<ConfirmationStatus>();
      vi.mocked(confirmation.warn).mockReturnValueOnce(answer.promise);
      await buttonSaying(wrapper, 'RemoveFromTenant').trigger('click');
      const state = config.snapshot();
      if (reason === 'permission') config.setState({ ...state, auth: { grantedPolicies: {} } });
      else
        config.setState({
          ...state,
          multiTenancy: { ...state.multiTenancy, userSharingStrategy: 0 },
        });
      config.setState(state);
      answer.resolve(ConfirmationStatus.confirm);
      await flushPromises();
      expect(api.removeFromTenant).not.toHaveBeenCalled();
    },
  );
});

describe('commercial users page composition', () => {
  it('opens the contributed action and refreshes the existing page without resetting pagination', async () => {
    const api = apiWith();
    const getList = vi.fn(() => Promise.resolve({ items: [USER], totalCount: 30 }));
    const injector = environment(api, WRITE_POLICIES, [
      ...provideIdentityPro(),
      { provide: IdentityUserService, useValue: { ...api, getList } },
    ]);
    injector.runInContext(identityProExtensionsResolver);
    const wrapper = mount(UsersPage, mountOptions(injector));
    mounted.push(wrapper);
    await flushPromises();

    const secondPage = wrapper.findAll('nav button').find(button => button.text() === '2');
    expect(secondPage).toBeDefined();
    await secondPage?.trigger('click');
    await flushPromises();
    expect(getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ skipCount: 10 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await buttonSaying(wrapper, 'AbpIdentity::SetPassword').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="dialog"]').text()).toContain('john');
    await fillPassword(wrapper);
    await buttonSaying(wrapper, 'Save').trigger('click');
    await flushPromises();
    expect(getList).toHaveBeenCalledTimes(3);
    expect(getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ skipCount: 10 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('AbpIdentity::NewUser');
    expect(wrapper.text()).toContain('AbpUi::Edit');
  });

  it('hides lock for the current user and users without lockout and offers unlock for locked rows', async () => {
    const records = [
      { ...USER, id: 'admin', userName: 'admin' },
      { ...USER, id: 'no-lockout', userName: 'no-lockout', lockoutEnabled: false },
      {
        ...USER,
        id: 'locked',
        userName: 'locked',
        isLockedOut: true,
        lockoutEnd: new Date(Date.now() + 86_400_000).toISOString(),
      },
      USER,
    ];
    const injector = environment(apiWith(), WRITE_POLICIES, [
      ...provideIdentityPro(),
      {
        provide: IdentityUserService,
        useValue: { getList: () => Promise.resolve({ items: records, totalCount: 4 }) },
      },
    ]);
    injector.runInContext(identityProExtensionsResolver);
    const wrapper = mount(UsersPage, mountOptions(injector));
    mounted.push(wrapper);
    await flushPromises();
    const rows = wrapper.findAll('tbody tr');
    expect(rows[0]?.text()).not.toContain('AbpIdentity::Lock');
    expect(rows[1]?.text()).not.toContain('AbpIdentity::Lock');
    expect(rows[2]?.text()).toContain('AbpIdentity::Unlock');
    expect(rows[3]?.text()).toContain('AbpIdentity::Lock');
  });
});
