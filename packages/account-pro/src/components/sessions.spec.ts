import {
  ABP_INJECTOR_KEY,
  AuthService,
  ConfigStateService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { AccountSessionService, type IdentitySessionDto } from '@lsw-abpvue/account-pro/proxy';
import { ConfirmationService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { afterEach, expect, it, vi } from 'vitest';
import AccountSessionsPage from './AccountSessionsPage.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
it('uses one fresh read to refresh sessions and recover from an uncertain revocation', async () => {
  const record: IdentitySessionDto = {
    id: 'other-session',
    userId: 'member',
    device: 'Old device',
    isCurrent: false,
    signedIn: '2026-10-22T10:00:00Z',
    extraProperties: {},
  };
  const getList = vi.fn(() => Promise.resolve({ items: [{ ...record }], totalCount: 1 }));
  const revoke = vi.fn<() => Promise<void>>().mockRejectedValueOnce(new Error('Connection lost'));
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: AuthService, useValue: { isAuthenticated: computed(() => true) } },
    { provide: AccountSessionService, useValue: { getList, revoke } },
    { provide: ConfirmationService, useValue: { warn: () => Promise.resolve('confirm') } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'member' },
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/account/sessions', component: AccountSessionsPage }],
  });
  await router.push('/account/sessions');
  const wrapper = mount(AccountSessionsPage, {
    global: {
      plugins: [router],
      provide: { [ABP_INJECTOR_KEY as symbol]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  expect(getList).toHaveBeenCalledOnce();
  const button = (text: string) => {
    const result = wrapper.findAll('button').find(button => button.text() === text);
    if (!result) throw new Error(`Missing ${text} button`);
    return result;
  };
  await button('AbpUi::Delete').trigger('click');
  await flushPromises();
  expect(button('AbpUi::Delete').attributes('disabled')).toBeDefined();
  record.device = 'Fresh device';
  await button('AbpUi::Refresh').trigger('click');
  await flushPromises();
  expect(getList).toHaveBeenCalledTimes(2);
  expect(wrapper.text()).toContain('Fresh device');
  expect(button('AbpUi::Delete').attributes('disabled')).toBeUndefined();
});
