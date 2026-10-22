import {
  ABP_INJECTOR_KEY,
  AuthService,
  ConfigStateService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { IdentitySessionService, type IdentitySessionDto } from '@lsw-abpvue/identity-pro/proxy';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserSessionsDialog from './UserSessionsDialog.vue';
import SessionDetailsDialog from './SessionDetailsDialog.vue';
const session: IdentitySessionDto = {
  id: 'session-a',
  userId: 'user-a',
  userName: '<b>sample</b>',
  isCurrent: false,
  device: 'Web',
  deviceInfo: 'Browser',
  signedIn: '2026-10-20T10:00:00Z',
  lastAccessed: null,
  ipAddresses: ['127.0.0.1', '::1'],
  clientId: 'client',
};
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  document.body.innerHTML = '';
});
function api() {
  return {
    getList: vi.fn(() => Promise.resolve({ items: [session], totalCount: 1 })),
    get: vi.fn(() => Promise.resolve(session)),
    revoke: vi.fn(() => Promise.resolve()),
  };
}
async function render(service = api(), details = false, allowed = true) {
  const confirmation = {
    warn: vi.fn<() => Promise<ConfirmationStatus>>(() =>
      Promise.resolve(ConfirmationStatus.confirm),
    ),
  };
  const auth = {
    clearSession: vi.fn(() => Promise.resolve()),
    logout: vi.fn(() => Promise.resolve()),
  };
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: IdentitySessionService, useValue: service },
    { provide: ConfirmationService, useValue: confirmation },
    { provide: AuthService, useValue: auth },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    currentUser: { ...state.currentUser, id: 'user-a', isAuthenticated: true },
    auth: { grantedPolicies: { 'AbpIdentity.Sessions': allowed } },
  });
  vi.spyOn(config, 'refreshAppState').mockResolvedValue(config.snapshot());
  const wrapper = details
    ? mount(SessionDetailsDialog, {
        props: { sessionId: 'session-a', userId: 'user-a' },
        global: { provide: { [ABP_INJECTOR_KEY]: injector } },
      })
    : mount(UserSessionsDialog, {
        props: { userId: 'user-a', displayName: 'sample' },
        global: { provide: { [ABP_INJECTOR_KEY]: injector } },
      });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, service, confirmation, auth, config };
}
async function revoke(wrapper: VueWrapper) {
  const button = wrapper.findAll('button').find(item => item.text() === 'Session:Logout');
  if (!button) throw new TypeError('Revoke action missing.');
  await button.trigger('click');
  await flushPromises();
}
describe('commercial user sessions', () => {
  it('scopes the paged list to the selected user and shows all four session columns', async () => {
    const { wrapper, service } = await render();
    expect(service.getList).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-a', maxResultCount: 10, sorting: 'signedIn desc' }),
      expect.anything(),
    );
    expect(wrapper.findAll('th')).toHaveLength(5);
    expect(wrapper.text()).toContain('Web');
    expect(wrapper.text()).toContain('Browser');
  });
  it('does not read sessions without the dedicated policy', async () => {
    const { service } = await render(api(), false, false);
    expect(service.getList).not.toHaveBeenCalled();
  });
  it('contains read failures and offers an explicit retry', async () => {
    const service = api();
    service.getList.mockRejectedValueOnce(new TypeError('private error'));
    const { wrapper } = await render(service);
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    const button = wrapper.findAll('button').find(item => item.text() === 'Refresh');
    await button?.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Web');
    expect(wrapper.text()).not.toContain('private error');
  });
  it('rejects rows that belong to another user', async () => {
    const service = api();
    service.getList.mockResolvedValue({ items: [{ ...session, userId: 'other' }], totalCount: 1 });
    const { wrapper } = await render(service);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Browser');
  });
  it('reads fresh session details before revoking and reloads after a successful revoke', async () => {
    const { wrapper, service } = await render();
    await revoke(wrapper);
    expect(service.get).toHaveBeenCalledWith('session-a', expect.anything());
    expect(service.revoke).toHaveBeenCalledTimes(1);
    expect(service.getList).toHaveBeenCalledTimes(2);
  });
  it('does not revoke if confirmation is declined', async () => {
    const { wrapper, service, confirmation } = await render();
    confirmation.warn.mockResolvedValue(ConfirmationStatus.reject);
    await revoke(wrapper);
    expect(service.revoke).not.toHaveBeenCalled();
  });
  it('blocks repeated revocation after a failed request until sessions are reloaded', async () => {
    const service = api();
    service.revoke.mockRejectedValue(new TypeError('private error'));
    const { wrapper } = await render(service);
    await revoke(wrapper);
    await revoke(wrapper);
    expect(service.revoke).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('ErrorLoadingDatatable');
    expect(wrapper.text()).not.toContain('private error');
  });
  it('clears local authentication and refreshes app configuration after revoking the current session', async () => {
    const service = api();
    service.get.mockResolvedValue({ ...session, isCurrent: false });
    service.getList.mockResolvedValue({ items: [{ ...session, isCurrent: true }], totalCount: 1 });
    const { wrapper, auth, config } = await render(service);
    await revoke(wrapper);
    expect(auth.clearSession).toHaveBeenCalledTimes(1);
    expect(auth.logout).not.toHaveBeenCalled();
    expect(config.refreshAppState).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
  it('does not revoke if the operator changes context during confirmation', async () => {
    const { wrapper, service, config, confirmation } = await render();
    let done: ((value: ConfirmationStatus) => void) | undefined;
    confirmation.warn.mockImplementation(
      () =>
        new Promise(resolve => {
          done = resolve;
        }),
    );
    await revoke(wrapper);
    config.setState({ ...config.snapshot(), currentTenant: { id: 'tenant-b', isAvailable: true } });
    done?.(ConfirmationStatus.confirm);
    await flushPromises();
    expect(service.revoke).not.toHaveBeenCalled();
  });
  it('shows all details with plain strings, IP addresses and localized dates', async () => {
    const { wrapper } = await render(api(), true);
    expect(wrapper.findAll('tr')).toHaveLength(11);
    expect(wrapper.text()).toContain('<b>sample</b>');
    expect(wrapper.find('b').exists()).toBe(false);
    expect(wrapper.text()).toContain('127.0.0.1, ::1');
  });
  it('does not disclose another user session when details return an unexpected subject', async () => {
    const service = api();
    service.get.mockResolvedValue({ ...session, userId: 'other' });
    const { wrapper } = await render(service, true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Browser');
  });
  it('discards delayed details after permission is revoked', async () => {
    const service = api();
    let done: ((value: IdentitySessionDto) => void) | undefined;
    service.get.mockImplementation(
      () =>
        new Promise(resolve => {
          done = resolve;
        }),
    );
    const { wrapper, config } = await render(service, true);
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    done?.(session);
    await flushPromises();
    expect(wrapper.text()).not.toContain('Browser');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
