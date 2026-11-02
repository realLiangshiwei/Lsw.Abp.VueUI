import {
  ABP_INJECTOR_KEY,
  AuthService,
  LocalizationService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { UserSharingService } from '@lsw-abpvue/account-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AccountInvitationPage from './AccountInvitationPage.vue';
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
});
async function setup(requireRegister: boolean, failed = false) {
  const getInvitationByToken = vi.fn(async () => {
    if (failed) throw new TypeError('Unavailable');
    return {
      inviteeEmail: 'member@example.test',
      suggestedUserName: 'member',
      requireRegister,
      tenantName: 'Example tenant',
    };
  });
  const acceptInvitation = vi.fn(async () => {});
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: AuthService, useValue: { isAuthenticated: computed(() => false) } },
    { provide: UserSharingService, useValue: { getInvitationByToken, acceptInvitation } },
  ]);
  injectors.push(injector);
  vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(key => String(key));
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: AccountInvitationPage }],
  });
  await router.push('/?token=synthetic-token');
  const wrapper = mount(AccountInvitationPage, {
    global: { plugins: [router], provide: { [ABP_INJECTOR_KEY]: injector } },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, router, getInvitationByToken, acceptInvitation };
}
describe('account invitation', () => {
  it.each([false, true])(
    'loads the invitation and removes its token from navigation for registration=%s',
    async requireRegister => {
      const { wrapper, router } = await setup(requireRegister);
      expect(router.currentRoute.value.query).not.toHaveProperty('token');
      expect(wrapper.text()).toContain('member@example.test');
      expect(wrapper.find('input[name="invitationPassword"]').exists()).toBe(requireRegister);
    },
  );
  it('accepts an invitation for an existing account without registration fields', async () => {
    const { wrapper, acceptInvitation } = await setup(false);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(acceptInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'synthetic-token', userName: 'member' }),
      expect.anything(),
    );
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.find('form').exists()).toBe(false);
  });
  it('allows retrying an invitation lookup failure', async () => {
    const { wrapper, getInvitationByToken } = await setup(false, true);
    expect(wrapper.get('[role="alert"]').text()).toContain('InvitationLinkIsInvalid');
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(getInvitationByToken).toHaveBeenCalledTimes(2);
  });
});
