import { ManageProfileStateService, ManageProfileTabsService } from '@lsw-abpvue/account-core';
import { ProfileService, type ProfileDto } from '@lsw-abpvue/account-core/proxy';
import {
  ABP_INJECTOR_KEY,
  APP_INITIALIZERS,
  AuthService,
  ConfigStateService,
  createInjector,
  runInInjectionContext,
  type ApplicationConfigurationDto,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { ConfirmationService, ConfirmationStatus, ToasterService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { provideManageProfileTabs } from '../providers/manage-profile-tabs.provider.js';
import { accountExtensionsResolver } from '../resolvers/extensions.resolver.js';
import { ACCOUNT_RE_LOGIN_CONFIRMATION } from '../tokens/config-options.token.js';
import ChangePasswordTab from './ChangePasswordTab.vue';
import ManageProfilePage from './ManageProfilePage.vue';
import PersonalSettingsTab from './PersonalSettingsTab.vue';

const PROFILE: ProfileDto = {
  userName: 'admin',
  email: 'admin@abp.io',
  name: 'Admin',
  surname: '',
  phoneNumber: '',
  isExternal: false,
  hasPassword: true,
  concurrencyStamp: 'stamp',
};

interface ProfileSpies {
  get: () => Promise<ProfileDto>;
  update: (input: unknown) => Promise<ProfileDto>;
  changePassword: (input: unknown) => Promise<void>;
}

function profileService(overrides: Partial<ProfileSpies> = {}): ProviderInput {
  return {
    provide: ProfileService,
    useValue: {
      get: () => Promise.resolve(structuredClone(PROFILE)),
      update: (input: unknown) =>
        Promise.resolve({ ...PROFILE, ...(input as Partial<ProfileDto>) }),
      changePassword: () => Promise.resolve(),
      ...overrides,
    } as unknown as ProfileService,
  };
}

const authService: ProviderInput = {
  provide: AuthService,
  useValue: {
    isInternalAuth: true,
    isAuthenticated: { value: true },
    init: () => Promise.resolve(),
    navigateToLogin: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    login: () => Promise.resolve(),
    getAccessToken: () => null,
    refreshToken: () => Promise.resolve(),
  } as unknown as AuthService,
};

/** Refreshing the configuration goes to a backend no unit test has. */
function configStateWithoutBackend(): ProviderInput {
  const real = createInjector([]).get(ConfigStateService);

  return {
    provide: ConfigStateService,
    useValue: {
      ...real,
      refreshAppState: () => Promise.resolve(real.snapshot()),
    } as unknown as ConfigStateService,
  };
}

const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

function injectorWith(providers: ProviderInput[]): Injector {
  const injector = createInjector([
    ...plainTheme.providers,
    provideManageProfileTabs(),
    configStateWithoutBackend(),
    authService,
    ...providers,
  ]);

  const configState = injector.get(ConfigStateService);
  configState.setState({ ...configState.snapshot() } as ApplicationConfigurationDto);

  // What `createAbpApp` does at startup, and what registers the tabs.
  for (const initializer of injector.get(APP_INITIALIZERS, [], { optional: true })) {
    runInInjectionContext(injector, initializer);
  }

  injector.runInContext(() => accountExtensionsResolver());

  return injector;
}

async function render(component: Component, injector: Injector) {
  const wrapper: VueWrapper = mount(component as never, {
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string | { defaultValue: string }) =>
          typeof key === 'string' ? key : key.defaultValue,
      },
    },
  });

  mounted.push(wrapper);
  await new Promise(resolve => setTimeout(resolve));
  await wrapper.vm.$nextTick();

  return wrapper;
}

function type(name: string, value: string): void {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`No input called ${name}`);

  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('ManageProfilePage', () => {
  it('loads the profile and shows the tabs the module registered', async () => {
    const wrapper = await render(ManageProfilePage, injectorWith([profileService()]));

    // No localization is loaded, so a key resolves to its own last segment.
    expect(wrapper.findAll('[role=tab]').map(tab => tab.text())).toEqual([
      'ProfileTab:Password',
      'ProfileTab:PersonalInfo',
    ]);
  });

  it('leaves out the password tab for an account that signs in elsewhere', async () => {
    const external = { ...PROFILE, isExternal: true, hasPassword: false };
    const injector = injectorWith([profileService({ get: () => Promise.resolve(external) })]);
    const wrapper = await render(ManageProfilePage, injector);

    expect(wrapper.findAll('[role=tab]').map(tab => tab.text())).toEqual([
      'ProfileTab:PersonalInfo',
    ]);
  });

  it('shows a tab another module added', async () => {
    const injector = injectorWith([profileService()]);
    injector.get(ManageProfileTabsService).add([
      {
        name: 'MyModule.SecurityLog',
        text: 'MyModule::SecurityLog',
        component: { template: '<p>the log</p>' },
        order: 3,
      },
    ]);

    const wrapper = await render(ManageProfilePage, injector);
    const tabs = wrapper.findAll('[role=tab]');
    await tabs[2]?.trigger('click');

    expect(wrapper.text()).toContain('the log');
  });
});

describe('ChangePasswordTab', () => {
  function seeded(providers: ProviderInput[] = [], profile = PROFILE): Injector {
    const injector = injectorWith([profileService(), ...providers]);
    injector.get(ManageProfileStateService).set(profile);

    return injector;
  }

  it('sends the current and the new password', async () => {
    const changePassword = vi.fn<(input: unknown) => Promise<void>>(() => Promise.resolve());
    const injector = seeded([profileService({ changePassword })]);
    const wrapper = await render(ChangePasswordTab, injector);

    type('currentPassword', 'old-one');
    type('newPassword', '1q2w3E*');
    type('repeatNewPassword', '1q2w3E*');
    await wrapper.vm.$nextTick();
    await wrapper.find('form').trigger('submit');
    await new Promise(resolve => setTimeout(resolve));

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-one',
      newPassword: '1q2w3E*',
    });
    expect(injector.get(ToasterService).toasts.value).toHaveLength(1);
  });

  it('refuses two new passwords that are not the same', async () => {
    const changePassword = vi.fn<(input: unknown) => Promise<void>>(() => Promise.resolve());
    const wrapper = await render(ChangePasswordTab, seeded([profileService({ changePassword })]));

    type('currentPassword', 'old-one');
    type('newPassword', '1q2w3E*');
    type('repeatNewPassword', '1q2w3E?');
    await wrapper.vm.$nextTick();
    await wrapper.find('form').trigger('submit');

    expect(changePassword).not.toHaveBeenCalled();
  });

  it('does not ask for a current password there is none of', async () => {
    const external = { ...PROFILE, isExternal: true, hasPassword: false };
    const wrapper = await render(ChangePasswordTab, seeded([], external));

    expect(document.querySelector('input[name="currentPassword"]')).toBeNull();
    expect(wrapper.find('input[name="newPassword"]').exists()).toBe(true);
  });
});

describe('PersonalSettingsTab', () => {
  function seeded(providers: ProviderInput[] = []): Injector {
    const injector = injectorWith([profileService(), ...providers]);
    injector.get(ManageProfileStateService).set(structuredClone(PROFILE));

    return injector;
  }

  it('fills the form from the profile and saves what was changed', async () => {
    const update = vi.fn<(input: unknown) => Promise<ProfileDto>>(input =>
      Promise.resolve({ ...PROFILE, ...(input as Partial<ProfileDto>) }),
    );
    const injector = seeded([profileService({ update })]);
    const wrapper = await render(PersonalSettingsTab, injector);

    expect(document.querySelector<HTMLInputElement>('input[name="userName"]')?.value).toBe('admin');

    type('name', 'Administrator');
    await wrapper.vm.$nextTick();
    await wrapper.find('form').trigger('submit');
    await new Promise(resolve => setTimeout(resolve));

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Administrator' }));
    expect(injector.get(ToasterService).toasts.value).toHaveLength(1);
  });

  it('offers to sign in again when the name the session was issued for changed', async () => {
    const injector = seeded();
    const wrapper = await render(PersonalSettingsTab, injector);

    type('userName', 'administrator');
    await wrapper.vm.$nextTick();
    await wrapper.find('form').trigger('submit');
    await new Promise(resolve => setTimeout(resolve));

    expect(injector.get(ConfirmationService).current.value?.title).toBe(
      'AbpAccount::PersonalSettingsChangedConfirmationModalTitle',
    );
    injector.get(ConfirmationService).clear(ConfirmationStatus.dismiss);
  });

  it('does not offer when the application turned that off', async () => {
    const injector = seeded([{ provide: ACCOUNT_RE_LOGIN_CONFIRMATION, useValue: false }]);
    const wrapper = await render(PersonalSettingsTab, injector);

    type('userName', 'administrator');
    await wrapper.vm.$nextTick();
    await wrapper.find('form').trigger('submit');
    await new Promise(resolve => setTimeout(resolve));

    expect(injector.get(ConfirmationService).current.value).toBeNull();
  });
});
