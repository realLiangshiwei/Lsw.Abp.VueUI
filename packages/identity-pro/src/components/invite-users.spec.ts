import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InviteUsersDialog from './InviteUsersDialog.vue';

const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
const pendingPage: Awaited<ReturnType<IdentityUserService['getPendingInvitations']>> = {
  items: [
    {
      id: 'invitation',
      inviteeEmail: 'invitee@example.test',
      invitationDate: '2026-10-23T00:00:00Z',
      status: 0,
    },
  ],
  totalCount: 1,
};

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  document.body.innerHTML = '';
});

function api() {
  return {
    getAssignableRoles: vi.fn<IdentityUserService['getAssignableRoles']>(async () => ({
      items: [],
    })),
    getPendingInvitations: vi.fn<IdentityUserService['getPendingInvitations']>(
      async () => pendingPage,
    ),
    inviteUsers: vi.fn<IdentityUserService['inviteUsers']>(async () => ({
      newInvitations: 1,
      resentInvitations: 0,
    })),
    resendInvitation: vi.fn<IdentityUserService['resendInvitation']>(async () => {}),
  };
}

function render(service = api(), initialTab: 'invite' | 'pending' = 'invite') {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: IdentityUserService, useValue: service },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    currentUser: { ...state.currentUser, id: 'operator', isAuthenticated: true },
    currentTenant: { id: 'tenant', isAvailable: true },
    multiTenancy: { isEnabled: true, userSharingStrategy: 1 },
    auth: { grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.Create': true } },
  });
  const wrapper = mount(InviteUsersDialog, {
    props: { initialTab, appName: 'Web' },
    attachTo: document.body,
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });
  wrappers.push(wrapper);
  return { wrapper, service, config };
}

async function selectTab(wrapper: VueWrapper, name: 'invite' | 'pending') {
  const label = name === 'invite' ? 'InviteUser' : 'PendingInvitation';
  const tab = wrapper.findAll('[role="tab"]').find(item => item.text() === label);
  if (!tab) throw new TypeError(`The ${name} tab is missing.`);
  await tab.trigger('click');
  await flushPromises();
}

async function send(wrapper: VueWrapper) {
  await wrapper.get('textarea').setValue('new@example.test');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
}

describe('invitation tab loading', () => {
  it('loads pending invitations on first visit and reuses them until an invitation is sent', async () => {
    const { wrapper, service } = render();
    await flushPromises();
    expect(service.getPendingInvitations).not.toHaveBeenCalled();
    await selectTab(wrapper, 'pending');
    expect(wrapper.text()).toContain('invitee@example.test');
    expect(service.getPendingInvitations).toHaveBeenCalledOnce();
    await selectTab(wrapper, 'invite');
    await selectTab(wrapper, 'pending');
    expect(service.getPendingInvitations).toHaveBeenCalledOnce();

    await selectTab(wrapper, 'invite');
    await send(wrapper);
    expect(service.inviteUsers).toHaveBeenCalledWith(
      { appName: 'Web', emailAddress: ['new@example.test'], assignedRoles: [] },
      expect.any(Object),
    );
    expect(service.getPendingInvitations).toHaveBeenCalledOnce();
    await selectTab(wrapper, 'pending');
    expect(service.getPendingInvitations).toHaveBeenCalledTimes(2);
  });

  it('allows sending invitations when the pending list cannot be read', async () => {
    const service = api();
    service.getPendingInvitations.mockRejectedValue(new TypeError('Pending read failed.'));
    const { wrapper } = render(service, 'pending');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    await selectTab(wrapper, 'invite');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    await send(wrapper);
    expect(service.inviteUsers).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('InvitationSentSuccessfullyToUsers');
  });

  it('keeps pending invitations available while role loading is unfinished or failed', async () => {
    const service = api();
    let rejectRoles: (error: Error) => void = () => {};
    service.getAssignableRoles.mockReturnValue(
      new Promise((_, reject) => {
        rejectRoles = reject;
      }),
    );
    const { wrapper } = render(service, 'pending');
    await flushPromises();
    expect(wrapper.text()).toContain('invitee@example.test');
    rejectRoles(new TypeError('Role read failed.'));
    await flushPromises();
    const resend = wrapper.findAll('button').find(button => button.text() === 'ResendInvitation');
    if (!resend) throw new TypeError('The resend action is missing.');
    await resend.trigger('click');
    await flushPromises();
    expect(service.resendInvitation).toHaveBeenCalledOnce();
    await selectTab(wrapper, 'invite');
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    await send(wrapper);
    expect(service.inviteUsers).not.toHaveBeenCalled();
  });

  it('discards a pending read that started before a successful invitation', async () => {
    const service = api();
    let resolvePending: (page: typeof pendingPage) => void = () => {};
    service.getPendingInvitations.mockReturnValueOnce(
      new Promise(resolve => {
        resolvePending = resolve;
      }),
    );
    const { wrapper } = render(service, 'pending');
    await flushPromises();
    await selectTab(wrapper, 'invite');
    await send(wrapper);
    resolvePending(pendingPage);
    await flushPromises();
    await selectTab(wrapper, 'pending');
    expect(service.getPendingInvitations).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('invitee@example.test');
  });

  it('keeps failed writes blocked across tab changes until an explicit successful refresh', async () => {
    const service = api();
    service.inviteUsers.mockRejectedValueOnce(new TypeError('Invitation write failed.'));
    const { wrapper } = render(service);
    await flushPromises();
    await send(wrapper);
    await selectTab(wrapper, 'pending');
    await selectTab(wrapper, 'invite');
    await send(wrapper);
    expect(service.inviteUsers).toHaveBeenCalledOnce();
    const refresh = wrapper.findAll('button').find(button => button.text() === 'Refresh');
    if (!refresh) throw new TypeError('The refresh action is missing.');
    await refresh.trigger('click');
    await flushPromises();
    await send(wrapper);
    expect(service.inviteUsers).toHaveBeenCalledTimes(2);
  });

  it('does not let an earlier role read authorize retrying a later failed write', async () => {
    const service = api();
    let resolveRoles: (
      roles: Awaited<ReturnType<IdentityUserService['getAssignableRoles']>>,
    ) => void = () => {};
    service.getAssignableRoles.mockReturnValueOnce(
      new Promise(resolve => {
        resolveRoles = resolve;
      }),
    );
    service.resendInvitation.mockRejectedValueOnce(new TypeError('Invitation write failed.'));
    const { wrapper } = render(service);
    await flushPromises();
    await selectTab(wrapper, 'pending');
    const resend = wrapper.findAll('button').find(button => button.text() === 'ResendInvitation');
    if (!resend) throw new TypeError('The resend action is missing.');
    await resend.trigger('click');
    await flushPromises();
    resolveRoles({ items: [] });
    await flushPromises();
    await selectTab(wrapper, 'invite');
    await send(wrapper);
    expect(service.inviteUsers).not.toHaveBeenCalled();
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
  });

  it('discards pending data after the active tenant changes', async () => {
    const service = api();
    let resolvePending: (page: typeof pendingPage) => void = () => {};
    service.getPendingInvitations.mockReturnValueOnce(
      new Promise(resolve => {
        resolvePending = resolve;
      }),
    );
    const { wrapper, config } = render(service, 'pending');
    await flushPromises();
    config.setState({ ...config.snapshot(), currentTenant: { id: 'other', isAvailable: true } });
    resolvePending(pendingPage);
    await flushPromises();
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('invitee@example.test');
  });
});
