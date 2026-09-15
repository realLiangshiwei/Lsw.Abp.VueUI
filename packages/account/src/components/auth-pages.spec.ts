import { AccountService, type ProfileDto } from '@lsw-abpvue/account-core/proxy';
import {
  ABP_INJECTOR_KEY,
  AuthService,
  AuthError,
  ConfigStateService,
  createInjector,
  TwoFactorRequiredError,
  type ApplicationConfigurationDto,
  type Injector,
  type LoginParams,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { ToasterService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { ACCOUNT_APP_NAME } from '../tokens/config-options.token.js';
import ForgotPasswordPage from './ForgotPasswordPage.vue';
import LoginPage from './LoginPage.vue';
import RegisterPage from './RegisterPage.vue';
import ResetPasswordPage from './ResetPasswordPage.vue';

const page = { template: '<p>the page</p>' };

function authService(login: (params: LoginParams) => Promise<void>): ProviderInput {
  return {
    provide: AuthService,
    useValue: {
      isInternalAuth: true,
      isAuthenticated: { value: false },
      init: () => Promise.resolve(),
      navigateToLogin: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      login,
      getAccessToken: () => null,
      refreshToken: () => Promise.resolve(),
    } as unknown as AuthService,
  };
}

function accountService(
  overrides: Partial<Record<'register' | 'sendPasswordResetCode' | 'resetPassword', unknown>> = {},
): ProviderInput {
  return {
    provide: AccountService,
    useValue: {
      register: () => Promise.resolve({} as ProfileDto),
      sendPasswordResetCode: () => Promise.resolve(),
      resetPassword: () => Promise.resolve(),
      verifyPasswordResetToken: () => Promise.resolve(true),
      ...overrides,
    } as unknown as AccountService,
  };
}

const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

function injectorWith(providers: ProviderInput[], settings: Record<string, string> = {}): Injector {
  const injector = createInjector([...plainTheme.providers, ...providers]);
  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    setting: { values: settings },
  } as ApplicationConfigurationDto);

  return injector;
}

async function routerAt(path: string): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      { path: '/account/login', component: page },
      { path: '/account/register', component: page },
      { path: '/account/forgot-password', component: page },
      { path: '/account/reset-password', component: page },
    ],
  });
  await router.push(path);
  await router.isReady();

  return router;
}

async function render(component: Component, injector: Injector, router: Router) {
  const wrapper: VueWrapper = mount(component as never, {
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string | { defaultValue: string }) =>
          typeof key === 'string' ? key : key.defaultValue,
      },
    },
  });

  mounted.push(wrapper);
  await wrapper.vm.$nextTick();

  return wrapper;
}

function type(name: string, value: string): void {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`No input called ${name}`);

  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(wrapper: VueWrapper): Promise<void> {
  return wrapper.find('form').trigger('submit');
}

describe('LoginPage', () => {
  it('signs in with what was typed, and goes where the route said', async () => {
    const login = vi.fn<(params: LoginParams) => Promise<void>>(() => Promise.resolve());
    const injector = injectorWith([authService(login)]);
    const router = await routerAt('/account/login?returnUrl=/books');
    const wrapper = await render(LoginPage, injector, router);

    type('username', 'admin');
    type('password', '1q2w3E*');
    await wrapper.vm.$nextTick();
    await submit(wrapper);

    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'admin', password: '1q2w3E*', redirectUrl: '/books' }),
    );
  });

  it('refuses to submit an empty form', async () => {
    const login = vi.fn<(params: LoginParams) => Promise<void>>(() => Promise.resolve());
    const wrapper = await render(
      LoginPage,
      injectorWith([authService(login)]),
      await routerAt('/account/login'),
    );

    await submit(wrapper);

    expect(login).not.toHaveBeenCalled();
    // No localization is loaded, so a key resolves to its own last segment.
    expect(wrapper.text()).toContain('ThisFieldIsRequired.');
  });

  it('asks for the code from the authenticator when ABP wants a second factor', async () => {
    const login = vi
      .fn<(params: LoginParams) => Promise<void>>()
      .mockRejectedValueOnce(new TwoFactorRequiredError('user-1', 'token'))
      .mockResolvedValueOnce(undefined);
    const wrapper = await render(
      LoginPage,
      injectorWith([authService(login)]),
      await routerAt('/account/login'),
    );

    type('username', 'admin');
    type('password', '1q2w3E*');
    await wrapper.vm.$nextTick();
    await submit(wrapper);
    await wrapper.vm.$nextTick();

    expect(document.querySelector('input[name="twoFactorCode"]')).not.toBeNull();

    type('twoFactorCode', '123456');
    await wrapper.vm.$nextTick();
    await submit(wrapper);

    expect(login).toHaveBeenLastCalledWith(
      expect.objectContaining({ twoFactorProvider: 'Authenticator', twoFactorCode: '123456' }),
    );
  });

  it('says what the token endpoint refused with', async () => {
    const injector = injectorWith([
      authService(() => Promise.reject(new AuthError('invalid_grant'))),
    ]);
    const wrapper = await render(LoginPage, injector, await routerAt('/account/login'));

    type('username', 'admin');
    type('password', 'wrong');
    await wrapper.vm.$nextTick();
    await submit(wrapper);
    await new Promise(resolve => setTimeout(resolve));

    expect(injector.get(ToasterService).toasts.value).toHaveLength(1);
  });

  it('offers registration only while the backend allows it', async () => {
    const withRegistration = await render(
      LoginPage,
      injectorWith([authService(() => Promise.resolve())]),
      await routerAt('/account/login'),
    );
    expect(withRegistration.text()).toContain('AbpAccount::AreYouANewUser');

    const without = await render(
      LoginPage,
      injectorWith([authService(() => Promise.resolve())], {
        'Abp.Account.IsSelfRegistrationEnabled': 'false',
      }),
      await routerAt('/account/login'),
    );
    expect(without.text()).not.toContain('AbpAccount::AreYouANewUser');
  });
});

describe('RegisterPage', () => {
  it('registers and signs the new account straight in', async () => {
    const register = vi.fn<(input: unknown) => Promise<ProfileDto>>(() =>
      Promise.resolve({} as ProfileDto),
    );
    const login = vi.fn<(params: LoginParams) => Promise<void>>(() => Promise.resolve());
    const injector = injectorWith([
      accountService({ register }),
      authService(login),
      { provide: ACCOUNT_APP_NAME, useValue: 'Vue' },
    ]);
    const wrapper = await render(RegisterPage, injector, await routerAt('/account/register'));

    type('userName', 'jane');
    type('emailAddress', 'jane@abp.io');
    type('password', '1q2w3E*');
    await wrapper.vm.$nextTick();
    await submit(wrapper);
    await new Promise(resolve => setTimeout(resolve));

    expect(register).toHaveBeenCalledWith({
      userName: 'jane',
      emailAddress: 'jane@abp.io',
      password: '1q2w3E*',
      appName: 'Vue',
    });
    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'jane', password: '1q2w3E*' }),
    );
  });

  it('refuses a password the tenant policy would not accept', async () => {
    const register = vi.fn<(input: unknown) => Promise<ProfileDto>>(() =>
      Promise.resolve({} as ProfileDto),
    );
    const injector = injectorWith(
      [accountService({ register }), authService(() => Promise.resolve())],
      { 'Abp.Identity.Password.RequiredLength': '8' },
    );
    const wrapper = await render(RegisterPage, injector, await routerAt('/account/register'));

    type('userName', 'jane');
    type('emailAddress', 'jane@abp.io');
    type('password', 'sh0rT!');
    await wrapper.vm.$nextTick();
    await submit(wrapper);

    expect(register).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('PasswordTooShort');
  });

  it('says so when the backend has self registration switched off', async () => {
    const injector = injectorWith([accountService(), authService(() => Promise.resolve())], {
      'Abp.Account.IsSelfRegistrationEnabled': 'false',
    });
    await render(RegisterPage, injector, await routerAt('/account/register'));

    expect(injector.get(ToasterService).toasts.value[0]?.message).toBe(
      'AbpAccount::SelfRegistrationDisabledMessage',
    );
  });
});

describe('ForgotPasswordPage', () => {
  it('asks for the mail and says it was sent', async () => {
    const send = vi.fn<(input: unknown) => Promise<void>>(() => Promise.resolve());
    const injector = injectorWith([
      accountService({ sendPasswordResetCode: send }),
      { provide: ACCOUNT_APP_NAME, useValue: 'Vue' },
    ]);
    const wrapper = await render(
      ForgotPasswordPage,
      injector,
      await routerAt('/account/forgot-password'),
    );

    type('email', 'admin@abp.io');
    await wrapper.vm.$nextTick();
    await submit(wrapper);
    await new Promise(resolve => setTimeout(resolve));

    expect(send).toHaveBeenCalledWith({ email: 'admin@abp.io', appName: 'Vue' });
    expect(wrapper.text()).toContain('AbpAccount::PasswordResetMailSentMessage');
  });
});

describe('ResetPasswordPage', () => {
  const link = '/account/reset-password?userId=user-1&resetToken=abc';

  it('sends the new password with what the link carried', async () => {
    const reset = vi.fn<(input: unknown) => Promise<void>>(() => Promise.resolve());
    const injector = injectorWith([accountService({ resetPassword: reset })]);
    const wrapper = await render(ResetPasswordPage, injector, await routerAt(link));

    type('password', '1q2w3E*');
    type('confirmPassword', '1q2w3E*');
    await wrapper.vm.$nextTick();
    await submit(wrapper);
    await new Promise(resolve => setTimeout(resolve));

    expect(reset).toHaveBeenCalledWith({
      userId: 'user-1',
      resetToken: 'abc',
      password: '1q2w3E*',
    });
    expect(wrapper.text()).toContain('AbpAccount::YourPasswordIsSuccessfullyReset');
  });

  it('refuses two passwords that are not the same', async () => {
    const reset = vi.fn<(input: unknown) => Promise<void>>(() => Promise.resolve());
    const injector = injectorWith([accountService({ resetPassword: reset })]);
    const wrapper = await render(ResetPasswordPage, injector, await routerAt(link));

    type('password', '1q2w3E*');
    type('confirmPassword', '1q2w3E?');
    await wrapper.vm.$nextTick();
    await submit(wrapper);

    expect(reset).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('PasswordConfirmationFailed');
  });

  it('has nothing to offer when the link is missing what it needs', async () => {
    const wrapper = await render(
      ResetPasswordPage,
      injectorWith([accountService()]),
      await routerAt('/account/reset-password'),
    );

    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });
});
