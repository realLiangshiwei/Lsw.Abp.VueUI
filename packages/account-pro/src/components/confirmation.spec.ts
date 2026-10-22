import {
  ABP_INJECTOR_KEY,
  AuthService,
  ConfigStateService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { AccountService, IdentityLinkUserService } from '@lsw-abpvue/account-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed, defineComponent, h, shallowRef } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import {
  AccountAuthFlowService,
  type AccountAuthChallenge,
} from '../services/auth-flow.service.js';
import { AccountWorkflowsService } from '../services/account-workflows.service.js';
import { ConfirmUserPage, EmailConfirmationPage, LinkLoggedPage } from './auth-pages.js';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.useRealTimers();
});
async function setup(path: string) {
  const account = {
    verifyEmailConfirmationToken: vi.fn(() => Promise.resolve(true)),
    confirmEmail: vi.fn(() => Promise.resolve()),
    verifyChangeEmailToken: vi.fn(() => Promise.resolve(true)),
    changeEmail: vi.fn(() => Promise.resolve()),
    getConfirmationState: vi.fn(() =>
      Promise.resolve({ emailConfirmed: false, phoneNumberConfirmed: false }),
    ),
    sendEmailConfirmationToken: vi.fn(() => Promise.resolve()),
    sendPhoneNumberConfirmationToken: vi.fn(() => Promise.resolve()),
    confirmPhoneNumber: vi.fn(() => Promise.resolve()),
  };
  const challenge = shallowRef<AccountAuthChallenge>({
    step: 'confirm-user',
    userId: 'member',
    email: 'member@example.test',
  });
  const links = { getAllList: vi.fn(() => Promise.resolve({ items: [] as object[] })) };
  const workflows = { loginAs: vi.fn(() => Promise.resolve()) };
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: AuthService, useValue: { isAuthenticated: computed(() => false) } },
    { provide: AccountService, useValue: account },
    { provide: IdentityLinkUserService, useValue: links },
    { provide: AccountWorkflowsService, useValue: workflows },
    {
      provide: AccountAuthFlowService,
      useValue: { challenge: computed(() => challenge.value), clear: vi.fn() },
    },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    setting: {
      values: {
        'Abp.Identity.SignIn.RequireConfirmedEmail': 'true',
        'Abp.Identity.SignIn.RequireConfirmedPhoneNumber': 'true',
      },
    },
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/account/email-confirmation', component: EmailConfirmationPage },
      { path: '/account/confirm-user', component: ConfirmUserPage },
      { path: '/account/link-logged', component: LinkLoggedPage },
      { path: '/account/login', component: defineComponent(() => () => h('p', 'Login')) },
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
  return { wrapper, router, account, links, workflows };
}
describe('commercial account callbacks', () => {
  it('verifies the issuing tenant and consumes only the successfully confirmed token', async () => {
    const { wrapper, router, account } = await setup(
      '/account/email-confirmation?userId=member&confirmationToken=mail-token&__tenant=issuer&returnUrl=%2Fbooks#done',
    );
    expect(account.verifyEmailConfirmationToken).toHaveBeenCalledWith(
      { userId: 'member', token: 'mail-token' },
      expect.objectContaining({ skipAuthorization: true, headers: { __tenant: 'issuer' } }),
    );
    expect(account.confirmEmail).toHaveBeenCalledOnce();
    expect(wrapper.get('[role="status"]').text()).toBe(
      'AbpAccount::YourEmailAddressIsSuccessfullyConfirmed',
    );
    expect(router.currentRoute.value.query).toEqual({
      userId: 'member',
      __tenant: 'issuer',
      returnUrl: '/books',
    });
    expect(router.currentRoute.value.hash).toBe('#done');
    expect(wrapper.get('a').attributes('href')).toBe('/account/login?returnUrl=/books');
  });
  it('reads an uncertain confirmation again before allowing another write', async () => {
    const { wrapper, router, account } = await setup('/account/email-confirmation');
    account.confirmEmail.mockRejectedValueOnce(new Error('Connection interrupted after send'));
    await router.replace('/account/email-confirmation?userId=member&confirmationToken=uncertain');
    await flushPromises();
    expect(account.confirmEmail).toHaveBeenCalledOnce();
    account.verifyEmailConfirmationToken.mockResolvedValueOnce(false);
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(account.verifyEmailConfirmationToken).toHaveBeenCalledTimes(2);
    expect(account.confirmEmail).toHaveBeenCalledOnce();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toBe('AbpUi::ValidationErrorMessage');
  });
  it('uses the change-email contract for a new address', async () => {
    const { account } = await setup(
      '/account/email-confirmation?userId=member&confirmationToken=change-token&newEmailAddress=new%40example.test',
    );
    expect(account.changeEmail).toHaveBeenCalledWith(
      { userId: 'member', token: 'change-token', newEmailAddress: 'new@example.test' },
      expect.anything(),
    );
    expect(account.confirmEmail).not.toHaveBeenCalled();
  });
  it('returns only to an account found in the fresh linked-account list', async () => {
    const { wrapper, router, links, workflows } = await setup('/account/email-confirmation');
    const linked = {
      targetUserId: 'original',
      targetTenantId: 'tenant',
      targetUserName: 'Original',
    };
    links.getAllList.mockResolvedValueOnce({ items: [linked] });
    await router.replace('/account/link-logged?linkUserId=original&linkTenantId=tenant');
    await flushPromises();
    await wrapper
      .findAll('button')
      .find(b => b.text() === 'AbpAccount::ReturnToPreviousAccount')
      ?.trigger('click');
    await flushPromises();
    expect(workflows.loginAs).toHaveBeenCalledWith(linked);
  });
  it('sends email and phone challenges only on request and reads phone verification back', async () => {
    vi.useFakeTimers();
    const { wrapper, account } = await setup('/account/confirm-user');
    const verify = () => wrapper.findAll('button').filter(b => b.text() === 'AbpAccount::Verify');
    await verify()[0]?.trigger('click');
    await flushPromises();
    expect(account.sendEmailConfirmationToken).toHaveBeenCalledWith(
      { userId: 'member', appName: 'Vue' },
      expect.objectContaining({ skipAuthorization: true }),
    );
    expect(wrapper.get('[role="status"]').text()).toBe('AbpAccount::EmailConfirmationSentMessage');
    await wrapper.get('input[name="phoneNumber"]').setValue('+12025550123');
    await verify()[1]?.trigger('click');
    await flushPromises();
    await wrapper.get('input[name="phoneConfirmationToken"]').setValue('123456');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(account.confirmPhoneNumber).toHaveBeenCalledWith(
      { userId: 'member', token: '123456' },
      expect.objectContaining({ skipAuthorization: true }),
    );
    expect(account.getConfirmationState).toHaveBeenCalledTimes(2);
  });
});
