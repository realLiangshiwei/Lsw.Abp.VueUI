import {
  ABP_INJECTOR_KEY,
  AbpHttpError,
  AuthService,
  ConfigStateService,
  createInjector,
  DocumentService,
  TwoFactorRequiredError,
  type Injector,
  type LoginParams,
} from '@lsw-abpvue/core';
import { AccountService } from '@lsw-abpvue/account-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import {
  LoginPage,
  SendSecurityCodePage,
  LoginWithRecoveryCodePage,
  RegisterPage,
  ResetPasswordPage,
} from './auth-pages.js';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
async function setup(path = '/account/login') {
  const login = vi.fn<(params: LoginParams) => Promise<void>>().mockResolvedValue(undefined);
  const account = {
    getTwoFactorProviders: vi.fn(() => Promise.resolve(['Authenticator', 'Email'])),
    sendTwoFactorCode: vi.fn(() => Promise.resolve()),
    verifyPasswordResetToken: vi.fn(() => Promise.resolve(false)),
    resetPassword: vi.fn(() => Promise.resolve()),
    register: vi.fn(() => Promise.resolve()),
  };
  const injector = createInjector([
    ...plainTheme.providers,
    {
      provide: AuthService,
      useValue: { login, isAuthenticated: computed(() => false), isInternalAuth: true },
    },
    { provide: AccountService, useValue: account },
    { provide: DocumentService, useValue: { nativeDocument: undefined } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    setting: { values: { 'Abp.Identity.Password.RequiredLength': '8' } },
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/account/login', component: LoginPage },
      { path: '/account/send-security-code', component: SendSecurityCodePage },
      { path: '/account/login-with-recovery-code', component: LoginWithRecoveryCodePage },
      { path: '/account/reset-password', component: ResetPasswordPage },
      { path: '/account/register', component: RegisterPage },
    ],
  });
  await router.push(path);
  const wrapper = mount(RouterView, {
    global: {
      plugins: [router],
      provide: { [ABP_INJECTOR_KEY as symbol]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, router, login, account, config };
}
describe('local commercial authentication', () => {
  it('keeps the login destination when switching to registration without forwarding mail tokens', async () => {
    const { wrapper, router, login } = await setup(
      '/account/login?returnUrl=%2Forders%3Fpage%3D2&resetToken=private-token',
    );
    await wrapper.get('a[href^="/account/register"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ returnUrl: '/orders?page=2' });
    await wrapper.get('input[name="username"]').setValue('member');
    await wrapper.get('input[name="email"]').setValue('member@example.test');
    await wrapper.get('input[name="password"]').setValue('Example-password1!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(login).toHaveBeenCalledWith(expect.objectContaining({ redirectUrl: '/orders?page=2' }));
  });
  it('uses normal login error handling after registration', async () => {
    const { wrapper, account, login } = await setup('/account/register');
    login.mockRejectedValueOnce(new Error('Application configuration could not be loaded'));
    await wrapper.get('input[name="username"]').setValue('member');
    await wrapper.get('input[name="email"]').setValue('member@example.test');
    await wrapper.get('input[name="password"]').setValue('Example-password1!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(account.register).toHaveBeenCalledOnce();
    expect(login).toHaveBeenCalledWith(expect.objectContaining({ username: 'member' }));
    expect(wrapper.get('[role="alert"]').text()).toBe('AbpAccount::DefaultErrorMessage');
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined();
  });
  it('moves from password login to a real provider choice and sends a code only on request', async () => {
    const { wrapper, router, login, account } = await setup();
    login.mockRejectedValueOnce(new TwoFactorRequiredError('member-id', 'two-factor-token'));
    await wrapper.get('input[name="username"]').setValue('member');
    await wrapper.get('input[name="password"]').setValue('example-password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/account/send-security-code');
    expect(account.getTwoFactorProviders).toHaveBeenCalledWith(
      { userId: 'member-id', token: 'two-factor-token' },
      expect.anything(),
    );
    expect(account.sendTwoFactorCode).not.toHaveBeenCalled();
    await wrapper.get('select').setValue('Email');
    const send = wrapper
      .findAll('button')
      .find(button => button.text() === 'AbpAccount::ReSendCode');
    await send?.trigger('click');
    await flushPromises();
    expect(account.sendTwoFactorCode).toHaveBeenCalledWith(
      { userId: 'member-id', token: 'two-factor-token', provider: 'Email' },
      expect.anything(),
    );
    expect(wrapper.get('[role="status"]').text()).toBe(
      'AbpAccount::VerifySecurityCode_Information',
    );
  });
  it('refuses an invalid password-reset link before showing a password form', async () => {
    const { wrapper, account } = await setup(
      '/account/reset-password?userId=member&resetToken=invalid&__tenant=mail-tenant',
    );
    expect(account.verifyPasswordResetToken).toHaveBeenCalledWith(
      { userId: 'member', resetToken: 'invalid' },
      expect.objectContaining({ skipAuthorization: true, headers: { __tenant: 'mail-tenant' } }),
    );
    expect(wrapper.find('input[type="password"]').exists()).toBe(false);
    expect(account.resetPassword).not.toHaveBeenCalled();
  });
  it('verifies a new reset token when the link changes on the same page', async () => {
    const { wrapper, router, account } = await setup(
      '/account/reset-password?userId=member&resetToken=invalid',
    );
    account.verifyPasswordResetToken.mockResolvedValueOnce(true);
    await router.replace('/account/reset-password?userId=member&resetToken=fresh');
    await flushPromises();
    expect(account.verifyPasswordResetToken).toHaveBeenCalledTimes(2);
    expect(wrapper.find('input[name="password"]').exists()).toBe(true);
  });
  it('accepts a new reset link after successfully consuming the previous link', async () => {
    const { wrapper, router, account } = await setup('/account/reset-password');
    account.verifyPasswordResetToken.mockResolvedValue(true);
    await router.replace('/account/reset-password?userId=member&resetToken=first');
    await flushPromises();
    await wrapper.get('input[name="password"]').setValue('Example-password1!');
    await wrapper.get('input[name="confirmPassword"]').setValue('Example-password1!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe(
      'AbpAccount::YourPasswordIsSuccessfullyReset',
    );
    await router.replace('/account/reset-password?userId=member&resetToken=second');
    await flushPromises();
    expect(account.verifyPasswordResetToken).toHaveBeenCalledTimes(2);
    expect(wrapper.get<HTMLInputElement>('input[name="password"]').element.value).toBe('');
  });
  it('keeps registration editable when the required CAPTCHA has not completed', async () => {
    const { wrapper, account, config } = await setup('/account/register');
    config.setState({
      ...config.snapshot(),
      setting: {
        values: {
          ...config.snapshot().setting.values,
          'Abp.Account.Captcha.UseCaptchaOnRegistration': 'true',
        },
      },
    });
    await wrapper.get('input[name="username"]').setValue('member');
    await wrapper.get('input[name="email"]').setValue('member@example.test');
    await wrapper.get('input[name="password"]').setValue('Example-password1!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(account.register).not.toHaveBeenCalled();
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined();
    expect(wrapper.get<HTMLInputElement>('input[name="username"]').element.value).toBe('member');
  });
  it('allows correcting a registration rejected with a validation response', async () => {
    const { wrapper, account } = await setup('/account/register');
    account.register.mockRejectedValueOnce(
      new AbpHttpError({
        status: 400,
        statusText: 'Bad Request',
        method: 'POST',
        url: '/api/account/register',
      }),
    );
    await wrapper.get('input[name="username"]').setValue('member');
    await wrapper.get('input[name="email"]').setValue('member@example.test');
    await wrapper.get('input[name="password"]').setValue('Example-password1!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined();
    await wrapper.get('input[name="username"]').setValue('another-member');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(account.register).toHaveBeenCalledTimes(2);
  });
  it('does not repeat an uncertain registration when another submit event arrives', async () => {
    const { wrapper, account } = await setup('/account/register');
    account.register.mockRejectedValueOnce(new Error('Connection interrupted after send'));
    await wrapper.get('input[name="username"]').setValue('member');
    await wrapper.get('input[name="email"]').setValue('member@example.test');
    await wrapper.get('input[name="password"]').setValue('Example-password1!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(account.register).toHaveBeenCalledOnce();
  });
});
