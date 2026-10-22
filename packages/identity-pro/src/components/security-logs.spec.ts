import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  LocalizationService,
  createInjector,
  type Injector,
} from '@lsw-abpvue/core';
import {
  ExtensionsService,
  mergeWithDefaultProps,
  mergeWithDefaultActions,
} from '@lsw-abpvue/components';
import {
  IdentitySecurityLogService,
  type IdentitySecurityLogDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SECURITY_LOGS_ENTITY_ACTIONS,
  DEFAULT_SECURITY_LOGS_ENTITY_PROPS,
} from '../defaults/security-logs.js';
import SecurityLogsPage from './SecurityLogsPage.vue';
import SecurityLogDetailsDialog from './SecurityLogDetailsDialog.vue';
const log: IdentitySecurityLogDto = {
  id: 'log-a',
  creationTime: '2026-10-20T10:00:00Z',
  applicationName: 'application',
  identity: 'Identity',
  action: 'LoginSucceeded',
  userId: 'user-a',
  userName: '<b>sample</b>',
  clientIpAddress: '127.0.0.1',
  browserInfo: 'Browser',
  clientId: 'client',
  correlationId: 'correlation',
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
    getList: vi.fn(() => Promise.resolve({ items: [log], totalCount: 1 })),
    get: vi.fn(() => Promise.resolve(log)),
  };
}
async function render(service = api(), details = false, allowed = true) {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: IdentitySecurityLogService, useValue: service },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    currentUser: { ...state.currentUser, id: 'operator', isAuthenticated: true },
    auth: { grantedPolicies: { 'AbpIdentity.SecurityLogs': allowed } },
  });
  const extensions = injector.get(ExtensionsService);
  mergeWithDefaultProps(
    extensions.entityProps,
    { 'Identity.SecurityLogs': DEFAULT_SECURITY_LOGS_ENTITY_PROPS },
    {},
    {},
  );
  mergeWithDefaultActions(
    extensions.entityActions,
    { 'Identity.SecurityLogs': DEFAULT_SECURITY_LOGS_ENTITY_ACTIONS },
    {},
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/identity/security-logs', component: SecurityLogsPage }],
  });
  await router.push('/identity/security-logs?userName=initial');
  const wrapper = details
    ? mount(SecurityLogDetailsDialog, {
        props: { logId: 'log-a' },
        global: { provide: { [ABP_INJECTOR_KEY]: injector } },
      })
    : mount(SecurityLogsPage, {
        global: {
          plugins: [router],
          mocks: { $t: injector.get(LocalizationService).t },
          provide: { [ABP_INJECTOR_KEY]: injector },
        },
      });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, service, config, router };
}
async function search(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit');
  await flushPromises();
}
describe('commercial security logs', () => {
  it('applies a changed username query when navigation reuses the current page', async () => {
    const { wrapper, router, service } = await render();
    await router.push('/identity/security-logs?userName=another-user');
    await flushPromises();
    expect(wrapper.get('input[name="userName"]').element).toHaveProperty('value', 'another-user');
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ userName: 'another-user' }),
      expect.anything(),
    );
  });
  it('renders the nine canonical columns and applies username deep links', async () => {
    const { wrapper, service } = await render();
    expect(DEFAULT_SECURITY_LOGS_ENTITY_PROPS).toHaveLength(9);
    expect(wrapper.findAll('input')).toHaveLength(9);
    expect(service.getList).toHaveBeenCalledWith(
      expect.objectContaining({ userName: 'initial', sorting: 'creationTime desc' }),
      expect.anything(),
    );
  });
  it('combines all text filters when the search form is submitted', async () => {
    const { wrapper, service } = await render();
    for (const name of [
      'applicationName',
      'identity',
      'userName',
      'action',
      'clientId',
      'correlationId',
      'clientIpAddress',
    ])
      await wrapper.get(`input[name="${name}"]`).setValue(`value-${name}`);
    await search(wrapper);
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'value-action',
        userName: 'value-userName',
        applicationName: 'value-applicationName',
        identity: 'value-identity',
        clientId: 'value-clientId',
        correlationId: 'value-correlationId',
        clientIpAddress: 'value-clientIpAddress',
      }),
      expect.anything(),
    );
  });
  it('updates the username query parameter only after an applied search', async () => {
    const { wrapper, router } = await render();
    await wrapper.get('input[name="userName"]').setValue('changed');
    expect(router.currentRoute.value.query.userName).toBe('initial');
    await search(wrapper);
    expect(router.currentRoute.value.query.userName).toBe('changed');
  });
  it('clears all applied filters with a single action', async () => {
    const { wrapper, service } = await render();
    const button = wrapper.findAll('button').find(item => item.text() === 'Clear');
    await button?.trigger('click');
    await flushPromises();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ userName: expect.anything() }),
      expect.anything(),
    );
  });
  it('does not load a security log list without the dedicated policy', async () => {
    const { service } = await render(api(), false, false);
    expect(service.getList).not.toHaveBeenCalled();
  });
  it('contains list failures and exposes retry without raw server details', async () => {
    const service = api();
    service.getList.mockRejectedValue(new TypeError('private error'));
    const { wrapper } = await render(service);
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    expect(wrapper.text()).not.toContain('private error');
  });
  it('reads the full selected security log and shows twelve plain text fields', async () => {
    const { wrapper, service } = await render(api(), true);
    expect(service.get).toHaveBeenCalledWith(
      'log-a',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(wrapper.findAll('tr')).toHaveLength(12);
    expect(wrapper.text()).toContain('<b>sample</b>');
    expect(wrapper.find('b').exists()).toBe(false);
  });
  it('rejects a mismatched detail record', async () => {
    const service = api();
    service.get.mockResolvedValue({ ...log, id: 'other' });
    const { wrapper } = await render(service, true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Browser');
  });
  it('closes and clears details when the operator loses access', async () => {
    const { wrapper, config } = await render(api(), true);
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await flushPromises();
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Browser');
  });
  it('discards a late detail response after changing the selected log', async () => {
    const service = api();
    let done: ((value: IdentitySecurityLogDto) => void) | undefined;
    service.get.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          done = resolve;
        }),
    );
    service.get.mockResolvedValue({ ...log, id: 'other', userName: 'new user' });
    const { wrapper } = await render(service, true);
    await wrapper.setProps({ logId: 'other' });
    done?.(log);
    await flushPromises();
    expect(wrapper.text()).toContain('new user');
    expect(wrapper.text()).not.toContain('<b>sample</b>');
  });
});
