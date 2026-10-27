import {
  ABP_INJECTOR_KEY,
  AbpHttpError,
  ConfigStateService,
  createInjector,
  LocalizationService,
  ReplaceableComponentsService,
  WindowService,
  type Injector,
  type PagedResultDto,
} from '@lsw-abpvue/core';
import {
  EntityAction,
  EntityProp,
  ExtensionsService,
  PropType,
  ToolbarAction,
} from '@lsw-abpvue/components';
import {
  AuditLogsService,
  AuditLogSettingsService,
  type AuditLogDto,
  type EntityChangeDto,
  type EntityChangeWithUsernameDto,
} from '@lsw-abpvue/audit-logging/proxy';
import {
  EntityHistoryService,
  provideAuditLogging as provideAuditHistory,
  provideAuditLoggingConfig,
  SHOW_ENTITY_DETAILS,
  SHOW_ENTITY_HISTORY,
} from '@lsw-abpvue/audit-logging/config';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { ToasterService } from '@lsw-abpvue/theme-shared';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, type Component } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuditLoggingRoutes } from '../routes.js';
import { auditLoggingGuard } from '../guards/audit-logging.guard.js';
import { AuditLoggingComponents } from '../enums/components.js';
import { provideAuditLogging } from '../providers/audit-logging.provider.js';
import { auditLoggingExtensionsResolver } from '../resolvers/extensions.resolver.js';
import type { AuditLoggingConfigOptions } from '../tokens/extensions.token.js';
import AuditLogsPage from './AuditLogsPage.vue';
import AuditLogDetailsDialog from './AuditLogDetailsDialog.vue';
import EntityChangesPage from './EntityChangesPage.vue';
import EntityChangeDetailsDialog from './EntityChangeDetailsDialog.vue';
import EntityChangeDetails from './EntityChangeDetails.vue';
import ErrorRateWidget from './ErrorRateWidget.vue';
import AverageExecutionDurationWidget from './AverageExecutionDurationWidget.vue';
import EntityHistoryHost from './EntityHistoryHost.vue';
import EntityHistoryDialog from './EntityHistoryDialog.vue';
import AuditLogSettings from '../../config/src/components/AuditLogSettings.vue';
import {
  AuditLogsPage as LazyAuditLogsPage,
  EntityChangeDetails as LazyEntityChangeDetails,
  loadEntityHistoryHost,
} from '../index.js';

const change: EntityChangeDto = {
  id: 'change-a',
  auditLogId: 'log-a',
  changeTime: '2026-10-20T10:00:00Z',
  changeType: 0,
  entityId: 'entity-a',
  entityTypeFullName: 'Example.Book',
  tenantId: 'tenant-a',
  propertyChanges: [
    {
      id: 'property-a',
      entityChangeId: 'change-a',
      propertyName: 'Name',
      originalValue: 'old',
      newValue: '<b>new</b>',
    },
  ],
};
const detail: EntityChangeWithUsernameDto = { userName: 'actor', entityChange: change };
const log: AuditLogDto = {
  id: 'log-a',
  executionTime: '2026-10-20T10:00:00Z',
  executionDuration: 12,
  url: '/audited',
  httpMethod: 'GET',
  httpStatusCode: 200,
  userName: 'actor',
  clientIpAddress: '127.0.0.1',
  clientName: 'client',
  browserInfo: 'browser',
  applicationName: 'application',
  correlationId: 'correlation',
  exceptions: '<script>exception</script>',
  comments: 'comment',
  impersonatorUserId: 'impersonator',
  impersonatorUserName: 'original-user',
  impersonatorTenantId: 'original-tenant',
  impersonatorTenantName: 'Original tenant',
  extraProperties: { markup: '<img src=x>' },
  entityChanges: [change],
  actions: [
    {
      id: 'action-a',
      auditLogId: 'log-a',
      serviceName: 'BookService',
      methodName: 'Update',
      executionTime: '2026-10-20T10:00:00Z',
      executionDuration: 10,
      parameters: '<b>parameters</b>',
    },
  ],
};
function api() {
  return {
    getList: vi.fn<AuditLogsService['getList']>(async () => ({ items: [log], totalCount: 21 })),
    get: vi.fn<AuditLogsService['get']>(async () => log),
    getEntityChanges: vi.fn<AuditLogsService['getEntityChanges']>(async () => ({
      items: [change],
      totalCount: 1,
    })),
    getEntityChangeWithUsername: vi.fn<AuditLogsService['getEntityChangeWithUsername']>(
      async () => detail,
    ),
    getEntityChangesWithUsername: vi.fn<AuditLogsService['getEntityChangesWithUsername']>(
      async () => [detail],
    ),
    exportToExcel: vi.fn<AuditLogsService['exportToExcel']>(async () => ({
      fileName: 'AuditLogs.xlsx',
      fileData: 'UEs=',
      isBackgroundJob: false,
    })),
    exportEntityChangesToExcel: vi.fn<AuditLogsService['exportEntityChangesToExcel']>(async () => ({
      fileName: 'EntityChanges.xlsx',
      fileData: [80, 75],
      isBackgroundJob: false,
    })),
    getErrorRate: vi.fn<AuditLogsService['getErrorRate']>(async () => ({
      data: { Fault: 1, Success: 4 },
    })),
    getAverageExecutionDurationPerDay: vi.fn<AuditLogsService['getAverageExecutionDurationPerDay']>(
      async () => ({ data: { '2026-10-20': 25 } }),
    ),
  };
}
function settingsApi() {
  return {
    get: vi.fn<AuditLogSettingsService['get']>(async () => ({
      isExpiredDeleterEnabled: true,
      expiredDeleterPeriod: 30,
    })),
    getGlobal: vi.fn<AuditLogSettingsService['getGlobal']>(async () => ({
      isPeriodicDeleterEnabled: true,
      isExpiredDeleterEnabled: true,
      expiredDeleterPeriod: 90,
    })),
    update: vi.fn<AuditLogSettingsService['update']>(async () => {}),
    updateGlobal: vi.fn<AuditLogSettingsService['updateGlobal']>(async () => {}),
  };
}
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});
function environment(options: AuditLoggingConfigOptions = {}) {
  const service = api();
  const settings = settingsApi();
  const download = vi.fn();
  const injector = createInjector([
    ...plainTheme.providers,
    ...provideAuditHistory(),
    ...provideAuditLogging(options),
    { provide: AuditLogsService, useValue: service },
    { provide: AuditLogSettingsService, useValue: settings },
    { provide: WindowService, useValue: { downloadBlob: download } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'operator', isAuthenticated: true },
    auth: {
      grantedPolicies: {
        'AuditLogging.AuditLogs': true,
        'AuditLogging.AuditLogs.Export': true,
        'AuditLogging.AuditLogs.SettingManagement': true,
      },
    },
    features: {
      values: { 'AuditLogging.Enable': 'true', 'AuditLogging.SettingManagement': 'true' },
    },
    localization: {
      ...config.snapshot().localization,
      values: {
        AbpAuditLogging: {},
        AbpUi: {},
        AbpIdentity: {},
        AbpValidation: {},
        AbpAccount: {},
      },
    },
  });
  injector.runInContext(auditLoggingExtensionsResolver);
  const refresh = vi
    .spyOn(config, 'refreshAppState')
    .mockImplementation(async () => config.snapshot());
  return { injector, config, service, settings, download, refresh };
}
async function render(
  component: Component = AuditLogsPage,
  props: Record<string, unknown> = {},
  env = environment(),
) {
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: env.injector },
      mocks: { $t: env.injector.get(LocalizationService).t },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, ...env };
}
function button(wrapper: VueWrapper, text: string) {
  const found = wrapper.findAll('button').find(item => item.text() === text);
  if (!found) throw new TypeError(`No visible button has the text ${text}.`);
  return found;
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(finish => {
    resolve = finish;
  });
  return { promise, resolve };
}

describe('audit logging pages', () => {
  it('loads the history host before the application renders its selected entity', async () => {
    const { wrapper, injector } = await render(await loadEntityHistoryHost());
    injector.get(EntityHistoryService).show('entity-a', 'Example.Book');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Example.Book'));
  });
  it('renders the public asynchronous component with its original props', async () => {
    const { wrapper } = await render(
      defineComponent({
        setup: () => () => h(LazyEntityChangeDetails, { itemWithUserName: detail }),
      }),
    );
    await vi.waitFor(() => expect(wrapper.text()).toContain('old'));
    expect(wrapper.text()).toContain('<b>new</b>');
    expect(wrapper.find('b').exists()).toBe(false);
    expect(
      createAuditLoggingRoutes()[0]?.children?.[0]?.meta?.replaceableComponent?.defaultComponent,
    ).toBe(LazyAuditLogsPage);
  });
  it('renders the canonical columns, HTTP badges and both audit tabs', async () => {
    const { wrapper, service } = await render();
    await vi.waitFor(() => expect(wrapper.text()).toContain('/audited'));
    expect(wrapper.text()).toContain('GET');
    expect(wrapper.text()).not.toContain(log.executionTime);
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(2);
    expect(wrapper.findAll('form input')).toHaveLength(9);
    expect(service.getList).toHaveBeenCalledWith(
      expect.objectContaining({ sorting: 'executionTime desc', maxResultCount: 10 }),
      expect.anything(),
    );
  });
  it('sends all audit filters including false and zero and exports the current draft without paging', async () => {
    const { wrapper, service, download } = await render();
    for (const [name, value] of Object.entries({
      userName: 'another',
      url: '/filtered',
      minExecutionDuration: '0',
      maxExecutionDuration: '50',
      applicationName: 'app',
      clientIpAddress: 'ip',
      correlationId: 'trace',
    }))
      await wrapper.get(`input[name="${name}"]`).setValue(value);
    await wrapper.get('select[name="hasException"]').setValue('false');
    await wrapper.get('select[name="httpMethod"]').setValue('POST');
    await wrapper.get('select[name="httpStatusCode"]').setValue('500');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({
        userName: 'another',
        hasException: false,
        minExecutionDuration: 0,
        maxExecutionDuration: 50,
        httpMethod: 'POST',
        httpStatusCode: 500,
        applicationName: 'app',
        clientIpAddress: 'ip',
        correlationId: 'trace',
      }),
      expect.anything(),
    );
    await wrapper.get('input[name="userName"]').setValue('unsaved-filter');
    await button(wrapper, 'ExportToExcel').trigger('click');
    await flushPromises();
    const query = service.exportToExcel.mock.calls[0]?.[0];
    expect(query).toMatchObject({
      userName: 'unsaved-filter',
      hasException: false,
      minExecutionDuration: 0,
      sorting: 'executionTime desc',
    });
    expect(query).not.toHaveProperty('skipCount');
    expect(query).not.toHaveProperty('maxResultCount');
    expect(download).toHaveBeenCalledWith(expect.any(Blob), 'AuditLogs.xlsx');
  });
  it('validates ranges before sending queries and clears filters', async () => {
    const { wrapper, service } = await render();
    await wrapper.get('input[name="minExecutionDuration"]').setValue('50');
    await wrapper.get('input[name="maxExecutionDuration"]').setValue('1');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(service.getList).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[aria-invalid="true"]').exists()).toBe(true);
    await button(wrapper, 'Clear').trigger('click');
    await flushPromises();
    expect(service.getList).toHaveBeenCalledTimes(2);
    expect(service.getList.mock.calls[1]?.[0].minExecutionDuration).toBeUndefined();
  });
  it.each([
    ['httpMethod', 'POST', 'POST'],
    ['httpStatusCode', '500', 500],
    ['hasException', 'false', false],
  ] as const)('queries immediately when %s is selected', async (name, value, expected) => {
    const { wrapper, service } = await render();
    await button(wrapper, '2').trigger('click');
    await wrapper.get(`select[name="${name}"]`).setValue(value);
    await flushPromises();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ [name]: expected, skipCount: 0 }),
      expect.anything(),
    );
  });
  it('paginates and sorts through the actual table controls', async () => {
    const { wrapper, service } = await render();
    await button(wrapper, '2').trigger('click');
    await flushPromises();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ skipCount: 10 }),
      expect.anything(),
    );
    const sort = wrapper.findAll('th button').find(item => item.text().includes('User'));
    expect(sort).toBeDefined();
    await sort?.trigger('click');
    await flushPromises();
    expect(service.getList.mock.lastCall?.[0].sorting).toContain('userName');
  });
  it('shows list failures with a working refresh action', async () => {
    const env = environment();
    env.service.getList.mockRejectedValueOnce(new TypeError('Unavailable query.'));
    const { wrapper, service } = await render(AuditLogsPage, {}, env);
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(service.getList).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
  it('discards a late response and clears the filter when the tenant changes', async () => {
    const env = environment();
    const pending = deferred<PagedResultDto<AuditLogDto>>();
    env.service.getList.mockImplementationOnce(() => pending.promise);
    const { wrapper, config, service } = await render(AuditLogsPage, {}, env);
    const signal = service.getList.mock.calls[0]?.[1]?.signal;
    config.setState({
      ...config.snapshot(),
      currentTenant: { ...config.snapshot().currentTenant, id: 'another-tenant' },
    });
    await flushPromises();
    expect(signal?.aborted).toBe(true);
    pending.resolve({ items: [{ ...log, url: '/old-tenant' }], totalCount: 1 });
    await flushPromises();
    expect(wrapper.text()).not.toContain('/old-tenant');
    expect(wrapper.text()).toContain('/audited');
  });
  it.each(['policy', 'feature', 'authentication'])(
    'does not query when access is disabled by %s',
    async reason => {
      const env = environment();
      const state = env.config.snapshot();
      env.config.setState({
        ...state,
        ...(reason === 'policy' ? { auth: { grantedPolicies: {} } } : {}),
        ...(reason === 'feature'
          ? { features: { values: { 'AuditLogging.Enable': 'FALSE' } } }
          : {}),
        ...(reason === 'authentication'
          ? { currentUser: { ...state.currentUser, isAuthenticated: false } }
          : {}),
      });
      const { wrapper, service } = await render(AuditLogsPage, {}, env);
      expect(service.getList).not.toHaveBeenCalled();
      expect(wrapper.find('form').exists()).toBe(false);
    },
  );
  it('removes results and dialogs immediately when permission is withdrawn', async () => {
    const { wrapper, config } = await render();
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await flushPromises();
    expect(wrapper.text()).not.toContain('/audited');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
  it.each(['permission', 'global feature'])(
    'removes backend extension columns after their %s is withdrawn',
    async policy => {
      const env = environment();
      env.config.setState({
        ...env.config.snapshot(),
        auth: { grantedPolicies: { 'AuditLogging.AuditLogs': true, CanSeeAuditDetail: true } },
        globalFeatures: { enabledFeatures: ['AuditColumns'] },
        objectExtensions: {
          modules: {
            AuditLogging: {
              entities: {
                AuditLog: {
                  properties: {
                    ServerProperty: {
                      type: 'System.String',
                      typeSimple: 'string',
                      ui: { onTable: { isVisible: true } },
                      policy: {
                        permissions: { permissionNames: ['CanSeeAuditDetail'], requiresAll: false },
                        globalFeatures: { features: ['AuditColumns'], requiresAll: false },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      env.service.getList.mockResolvedValue({
        items: [{ ...log, extraProperties: { ServerProperty: 'private-value' } }],
        totalCount: 1,
      });
      env.injector.runInContext(auditLoggingExtensionsResolver);
      const { wrapper, config, service } = await render(AuditLogsPage, {}, env);
      expect(wrapper.text()).toContain('private-value');
      const pending = deferred<PagedResultDto<AuditLogDto>>();
      service.getList.mockImplementationOnce(() => pending.promise);
      await button(wrapper, 'Refresh').trigger('click');
      const signal = service.getList.mock.lastCall?.[1]?.signal;
      config.setState({
        ...config.snapshot(),
        ...(policy === 'permission'
          ? { auth: { grantedPolicies: { 'AuditLogging.AuditLogs': true } } }
          : { globalFeatures: { enabledFeatures: [] } }),
      });
      expect(signal?.aborted).toBe(true);
      pending.resolve({ items: [{ ...log, url: '/stale-policy' }], totalCount: 1 });
      await flushPromises();
      expect(wrapper.text()).not.toContain('/stale-policy');
      expect(wrapper.text()).not.toContain('private-value');
      expect(wrapper.findAll('th').some(header => header.text() === 'ServerProperty')).toBe(false);
      config.setState({
        ...config.snapshot(),
        auth: { grantedPolicies: { 'AuditLogging.AuditLogs': true, CanSeeAuditDetail: true } },
        globalFeatures: { enabledFeatures: ['AuditColumns'] },
      });
      await flushPromises();
      expect(wrapper.text()).toContain('private-value');
    },
  );
  it('uses a replacement for the entity changes tab', async () => {
    const env = environment();
    env.injector.get(ReplaceableComponentsService).add({
      key: AuditLoggingComponents.EntityChanges,
      component: defineComponent(() => () => h('p', 'Replacement changes')),
    });
    const { wrapper, service } = await render(AuditLogsPage, {}, env);
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Replacement changes');
    expect(service.getEntityChanges).not.toHaveBeenCalled();
  });
  it('preserves the audit filter when returning from entity changes', async () => {
    const { wrapper, service } = await render();
    await wrapper.get('input[name="userName"]').setValue('another');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
    await flushPromises();
    await wrapper.findAll('[role="tab"]')[0]?.trigger('click');
    await flushPromises();
    expect(wrapper.get('input[name="userName"]').element).toHaveProperty('value', 'another');
    await button(wrapper, 'ExportToExcel').trigger('click');
    await flushPromises();
    expect(service.exportToExcel).toHaveBeenCalledWith(
      expect.objectContaining({ userName: 'another' }),
      expect.anything(),
    );
  });
  it('queries and exports entity changes with Created as numeric zero', async () => {
    const { wrapper, service, download } = await render(EntityChangesPage);
    await wrapper.get('select[name="entityChangeType"]').setValue('0');
    await wrapper.get('input[name="entityId"]').setValue('entity-a');
    await wrapper.get('input[name="entityTypeFullName"]').setValue('Example.Book');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(service.getEntityChanges).toHaveBeenLastCalledWith(
      expect.objectContaining({
        entityChangeType: 0,
        entityId: 'entity-a',
        entityTypeFullName: 'Example.Book',
        sorting: 'changeTime desc',
      }),
      expect.anything(),
    );
    await button(wrapper, 'ExportToExcel').trigger('click');
    await flushPromises();
    expect(service.exportEntityChangesToExcel.mock.calls[0]?.[0]).toMatchObject({
      entityChangeType: 0,
      entityId: 'entity-a',
    });
    expect(download).toHaveBeenCalledWith(expect.any(Blob), 'EntityChanges.xlsx');
  });
  it('queries immediately when the entity change type is selected', async () => {
    const { wrapper, service } = await render(EntityChangesPage);
    await wrapper.get('select[name="entityChangeType"]').setValue('0');
    await flushPromises();
    expect(service.getEntityChanges).toHaveBeenLastCalledWith(
      expect.objectContaining({ entityChangeType: 0, skipCount: 0 }),
      expect.anything(),
    );
  });
  it('opens entity change details and full history through the contributed row actions', async () => {
    const { wrapper, service, config } = await render(EntityChangesPage);
    await wrapper.get('summary').trigger('click');
    await button(wrapper, 'ChangeDetails').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('<b>new</b>');
    expect(service.getEntityChangeWithUsername).toHaveBeenCalledOnce();
    await button(wrapper, 'Close').trigger('click');
    await wrapper.get('summary').trigger('click');
    await button(wrapper, 'FullChangeHistory').trigger('click');
    await flushPromises();
    expect(service.getEntityChangesWithUsername).toHaveBeenCalledWith(
      { entityId: 'entity-a', entityTypeFullName: 'Example.Book' },
      expect.anything(),
    );
    expect(wrapper.text()).toContain('actor');
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
  it('honors application replacements for the entity history and detail commands', async () => {
    const env = environment();
    const history = vi.fn();
    const details = vi.fn();
    const injector = createInjector(
      [
        { provide: SHOW_ENTITY_HISTORY, useValue: history },
        { provide: SHOW_ENTITY_DETAILS, useValue: details },
      ],
      env.injector,
    );
    injectors.push(injector);
    const { wrapper, service } = await render(EntityChangesPage, {}, { ...env, injector });
    await wrapper.get('summary').trigger('click');
    await button(wrapper, 'FullChangeHistory').trigger('click');
    await flushPromises();
    expect(history).toHaveBeenCalledWith('entity-a', 'Example.Book');
    expect(service.getEntityChangesWithUsername).not.toHaveBeenCalled();
    await wrapper.get('summary').trigger('click');
    await button(wrapper, 'ChangeDetails').trigger('click');
    await flushPromises();
    expect(details).toHaveBeenCalledWith('change-a');
    expect(service.getEntityChangeWithUsername).not.toHaveBeenCalled();
  });
  it('recovers the entity changes list after a failed request', async () => {
    const env = environment();
    env.service.getEntityChanges.mockRejectedValueOnce(new TypeError('Unavailable changes.'));
    const { wrapper, service } = await render(EntityChangesPage, {}, env);
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(service.getEntityChanges).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Example.Book');
  });
  it('handles background exports and messages without requiring file data', async () => {
    const env = environment();
    env.service.exportToExcel.mockResolvedValueOnce({
      isBackgroundJob: true,
      message: 'Queued by server',
    });
    const { wrapper, download, injector } = await render(AuditLogsPage, {}, env);
    await button(wrapper, 'ExportToExcel').trigger('click');
    await flushPromises();
    expect(download).not.toHaveBeenCalled();
    expect(injector.get(ToasterService).toasts.value.at(-1)?.message).toBe('Queued by server');
  });
  it('shows a localized export failure and allows a retry', async () => {
    const env = environment();
    env.service.exportToExcel.mockRejectedValueOnce(new TypeError('Unavailable export.'));
    const { wrapper, download, injector } = await render(AuditLogsPage, {}, env);
    await button(wrapper, 'ExportToExcel').trigger('click');
    await flushPromises();
    expect(injector.get(ToasterService).toasts.value.at(-1)?.message).toBe(
      'AbpAuditLogging::ExportFailed',
    );
    await button(wrapper, 'ExportToExcel').trigger('click');
    await flushPromises();
    expect(download).toHaveBeenCalledOnce();
  });
  it('hides export without its precise policy', async () => {
    const env = environment();
    env.config.setState({
      ...env.config.snapshot(),
      auth: { grantedPolicies: { 'AuditLogging.AuditLogs': true } },
    });
    const { wrapper } = await render(AuditLogsPage, {}, env);
    expect(wrapper.findAll('button').some(item => item.text() === 'ExportToExcel')).toBe(false);
  });
});

describe('audit details', () => {
  it.each([
    ['logId', 'log-a', '/audited', AuditLogDetailsDialog],
    ['entityChangeId', 'change-a', 'Example.Book', EntityChangeDetailsDialog],
  ] as const)(
    'clears stale details when the selected %s target is cleared',
    async (key, id, value, component) => {
      const { wrapper } = await render(component, { [key]: id });
      expect(wrapper.text()).toContain(value);
      await wrapper.setProps({ [key]: '' });
      await flushPromises();
      expect(wrapper.text()).not.toContain(value);
    },
  );
  it.each([
    ['logId', 'log-a', '/audited', AuditLogDetailsDialog],
    ['entityChangeId', 'change-a', 'Example.Book', EntityChangeDetailsDialog],
  ] as const)(
    'cancels in-flight details when the selected %s target is cleared',
    async (key, id, value, component) => {
      const env = environment();
      const pendingLog = deferred<AuditLogDto>();
      const pendingChange = deferred<EntityChangeWithUsernameDto>();
      if (key === 'logId') env.service.get.mockImplementationOnce(() => pendingLog.promise);
      else
        env.service.getEntityChangeWithUsername.mockImplementationOnce(() => pendingChange.promise);
      const { wrapper, service } = await render(component, { [key]: id }, env);
      const signal = (key === 'logId' ? service.get : service.getEntityChangeWithUsername).mock
        .calls[0]?.[1]?.signal;
      await wrapper.setProps({ [key]: '' });
      expect(signal?.aborted).toBe(true);
      pendingLog.resolve(log);
      pendingChange.resolve(detail);
      await flushPromises();
      expect(wrapper.text()).not.toContain(value);
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
      await wrapper.setProps({ [key]: id });
      await flushPromises();
      expect(wrapper.text()).toContain(value);
    },
  );
  it('reads fresh details and shows every overall field as plain text', async () => {
    const { wrapper, service } = await render(AuditLogDetailsDialog, { logId: 'log-a' });
    expect(service.get).toHaveBeenCalledWith('log-a', expect.anything());
    for (const value of [
      '/audited',
      'actor',
      'client',
      'browser',
      'application',
      'correlation',
      'comment',
      'original-user',
      'Original tenant',
      '<script>exception</script>',
      '<img src=x>',
    ])
      expect(wrapper.text()).toContain(value);
    expect(wrapper.find('script').exists()).toBe(false);
    expect(wrapper.find('img').exists()).toBe(false);
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
    expect(wrapper.text()).toContain('BookService - Update');
    expect(wrapper.text()).toContain('<b>parameters</b>');
    expect(wrapper.find('b').exists()).toBe(false);
    await wrapper.findAll('[role="tab"]')[2]?.trigger('click');
    expect(wrapper.text()).toContain('Name');
    expect(wrapper.text()).toContain('<b>new</b>');
  });
  it('retries detail failures and rejects a response for a different log', async () => {
    const env = environment();
    env.service.get.mockResolvedValueOnce({ ...log, id: 'wrong-log' });
    const { wrapper, service } = await render(AuditLogDetailsDialog, { logId: 'log-a' }, env);
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('/audited');
    expect(service.get).toHaveBeenCalledTimes(2);
  });
  it('discards details when the target or authorization context changes', async () => {
    const env = environment();
    const pending = deferred<AuditLogDto>();
    env.service.get.mockImplementationOnce(() => pending.promise);
    env.service.get.mockResolvedValue({ ...log, id: 'log-b', url: '/fresh-log' });
    const { wrapper, config, service } = await render(
      AuditLogDetailsDialog,
      { logId: 'log-a' },
      env,
    );
    await wrapper.setProps({ logId: 'log-b' });
    await flushPromises();
    expect(service.get.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    pending.resolve(log);
    await flushPromises();
    expect(wrapper.text()).toContain('/fresh-log');
    expect(wrapper.text()).not.toContain('/audited');
    config.setState({
      ...config.snapshot(),
      currentTenant: { ...config.snapshot().currentTenant, id: 'different' },
    });
    await flushPromises();
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('/fresh-log');
  });
  it('reads entity change details and keeps property values as text', async () => {
    const { wrapper, service } = await render(EntityChangeDetailsDialog, {
      entityChangeId: 'change-a',
    });
    expect(service.getEntityChangeWithUsername).toHaveBeenCalledWith('change-a', expect.anything());
    expect(wrapper.text()).toContain('Example.Book');
    expect(wrapper.text()).toContain('actor');
    expect(wrapper.text()).toContain('<b>new</b>');
    expect(wrapper.find('b').exists()).toBe(false);
  });
  it('renders property changes without an actor and handles empty changes', async () => {
    const { wrapper } = await render(EntityChangeDetails, {
      itemWithUserName: { entityChange: { ...change, propertyChanges: [] } },
    });
    expect(wrapper.text()).toContain('NoDataAvailableInDatatable');
    expect(wrapper.text()).toContain('entity-a');
  });
  it('opens global entity detail commands through the optional host', async () => {
    const env = environment();
    env.injector.get(SHOW_ENTITY_DETAILS)('change-a');
    const { wrapper, injector } = await render(EntityHistoryHost, {}, env);
    expect(wrapper.text()).toContain('Example.Book');
    injector.get(EntityHistoryService).close();
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
});

describe('entity history', () => {
  it('keeps entity history available without granting access to the audit logs page', async () => {
    const env = environment();
    env.config.setState({
      ...env.config.snapshot(),
      auth: { grantedPolicies: { 'AuditLogging.ViewChangeHistory:Example.Book': true } },
    });
    const { wrapper, service } = await render(
      EntityHistoryDialog,
      { entityId: 'entity-a', entityTypeFullName: 'Example.Book' },
      env,
    );
    expect(wrapper.text()).toContain('actor');
    await button(wrapper, 'Detail').trigger('click');
    await flushPromises();
    expect(service.getEntityChangeWithUsername).toHaveBeenCalledWith('change-a', expect.anything());
    expect(wrapper.text()).toContain('<b>new</b>');
    expect(wrapper.find('b').exists()).toBe(false);
  });
  it('cancels the old history and property requests when the entity changes', async () => {
    const env = environment();
    const oldHistory = deferred<EntityChangeWithUsernameDto[]>();
    const oldDetail = deferred<EntityChangeWithUsernameDto>();
    const fresh: EntityChangeWithUsernameDto = {
      userName: 'fresh-actor',
      entityChange: { ...change, id: 'change-b', entityId: 'entity-b' },
    };
    env.service.getEntityChangesWithUsername.mockImplementationOnce(() => oldHistory.promise);
    env.service.getEntityChangesWithUsername.mockResolvedValue([fresh]);
    env.service.getEntityChangeWithUsername.mockImplementationOnce(() => oldDetail.promise);
    const { wrapper, service } = await render(
      EntityHistoryDialog,
      { entityId: 'entity-a', entityTypeFullName: 'Example.Book' },
      env,
    );
    await wrapper.setProps({ entityId: 'entity-b' });
    await flushPromises();
    oldHistory.resolve([detail]);
    await flushPromises();
    expect(service.getEntityChangesWithUsername.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(wrapper.text()).toContain('fresh-actor');
    await button(wrapper, 'Detail').trigger('click');
    await flushPromises();
    env.service.getEntityChangesWithUsername.mockResolvedValue([detail]);
    await wrapper.setProps({ entityId: 'entity-a' });
    await flushPromises();
    oldDetail.resolve(fresh);
    await flushPromises();
    expect(service.getEntityChangeWithUsername.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(wrapper.text()).not.toContain('fresh-actor');
    expect(wrapper.text()).not.toContain('<b>new</b>');
  });
});

describe('audit statistics', () => {
  it('supports drawing statistics through an exposed Vue component ref', async () => {
    const { wrapper, service } = await render(ErrorRateWidget);
    await wrapper
      .getComponent(ErrorRateWidget)
      .vm.draw({ startDate: '2026-10-01', endDate: '2026-10-23' });
    await flushPromises();
    expect(service.getErrorRate).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('Fault');
  });
  it.each([
    [ErrorRateWidget, 'getErrorRate', 'Fault'],
    [AverageExecutionDurationWidget, 'getAverageExecutionDurationPerDay', '2026-10-20'],
  ] as const)(
    'draws accessible statistics using the public initialized command',
    async (component, method, text) => {
      const { wrapper, service } = await render(component);
      const initialized = wrapper.emitted('initialized')?.[0]?.[0] as {
        draw: (filter: { startDate: string; endDate: string }) => Promise<void>;
      };
      await initialized.draw({ startDate: '2026-10-01', endDate: '2026-10-23' });
      await flushPromises();
      expect(service[method]).toHaveBeenCalledWith(
        { startDate: '2026-10-01', endDate: '2026-10-23' },
        expect.anything(),
      );
      expect(wrapper.find('svg[role="img"]').exists()).toBe(true);
      expect(wrapper.text()).toContain(text);
    },
  );
  it('retries statistics and clears them after access is withdrawn', async () => {
    const env = environment();
    env.service.getErrorRate.mockRejectedValueOnce(new TypeError('Unavailable statistics.'));
    const { wrapper, config } = await render(ErrorRateWidget, {}, env);
    const initialized = wrapper.emitted('initialized')?.[0]?.[0] as {
      draw: (filter: object) => Promise<void>;
    };
    await initialized.draw({});
    await flushPromises();
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Fault');
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await flushPromises();
    expect(wrapper.find('svg').exists()).toBe(false);
  });
});

describe('audit settings', () => {
  it('loads host global settings and switches to host general settings', async () => {
    const { wrapper, settings } = await render(AuditLogSettings);
    expect(settings.getGlobal).toHaveBeenCalledOnce();
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(2);
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
    await flushPromises();
    expect(settings.get).toHaveBeenCalledOnce();
    expect(wrapper.find('input[name="isPeriodicDeleterEnabled"]').exists()).toBe(false);
  });
  it('loads only tenant settings and never submits periodic cleanup for tenants', async () => {
    const env = environment();
    env.config.setState({
      ...env.config.snapshot(),
      currentTenant: { ...env.config.snapshot().currentTenant, id: 'tenant-a' },
    });
    const { wrapper, settings, refresh } = await render(AuditLogSettings, {}, env);
    expect(settings.getGlobal).not.toHaveBeenCalled();
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(1);
    await wrapper.get('input[name="expiredDeleterPeriod"]').setValue('60');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(settings.update).toHaveBeenCalledWith(
      { isExpiredDeleterEnabled: true, expiredDeleterPeriod: 60 },
      expect.anything(),
    );
    expect(settings.updateGlobal).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
  });
  it('validates the cleanup period and normalizes disabled deletion to zero', async () => {
    const { wrapper, settings } = await render(AuditLogSettings);
    await wrapper.get('input[name="expiredDeleterPeriod"]').setValue('0');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(settings.updateGlobal).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('InvalidAuditLogDeletionSettings');
    await wrapper.get('input[name="isExpiredDeleterEnabled"]').setValue(false);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(settings.updateGlobal).toHaveBeenCalledWith(
      { isPeriodicDeleterEnabled: true, isExpiredDeleterEnabled: false, expiredDeleterPeriod: 0 },
      expect.anything(),
    );
  });
  it('retains input and backend validation messages after a rejected save', async () => {
    const env = environment();
    env.settings.updateGlobal.mockRejectedValueOnce(
      new AbpHttpError({
        status: 400,
        statusText: 'Bad request',
        method: 'PUT',
        url: '/settings',
        error: { message: 'Server validation message' },
      }),
    );
    const { wrapper, settings } = await render(AuditLogSettings, {}, env);
    await wrapper.get('input[name="expiredDeleterPeriod"]').setValue('45');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('input[name="expiredDeleterPeriod"]').element).toHaveProperty('value', '45');
    expect(wrapper.get('[role="alert"]').text()).toContain('Server validation message');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(settings.updateGlobal).toHaveBeenCalledTimes(2);
  });
  it('retries configuration refresh without repeating a successful settings update', async () => {
    const env = environment();
    env.refresh.mockRejectedValueOnce(new TypeError('Unavailable configuration.'));
    const { wrapper, settings, refresh } = await render(AuditLogSettings, {}, env);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await wrapper.get('form').trigger('submit');
    await button(wrapper, 'Refresh').trigger('click');
    await flushPromises();
    expect(settings.updateGlobal).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
  it('retries failed reads and cancels the previous scope on a tenant switch', async () => {
    const env = environment();
    env.settings.getGlobal.mockRejectedValueOnce(new TypeError('Unavailable settings.'));
    const { wrapper, config, settings } = await render(AuditLogSettings, {}, env);
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(wrapper.find('form').exists()).toBe(true);
    config.setState({
      ...config.snapshot(),
      currentTenant: { ...config.snapshot().currentTenant, id: 'tenant-a' },
    });
    await flushPromises();
    expect(settings.get).toHaveBeenCalled();
    expect(wrapper.find('input[name="isPeriodicDeleterEnabled"]').exists()).toBe(false);
  });
  it('makes no settings requests when the feature is disabled', async () => {
    const env = environment();
    env.config.setState({
      ...env.config.snapshot(),
      features: { values: { 'AuditLogging.SettingManagement': 'false' } },
    });
    const { wrapper, settings } = await render(AuditLogSettings, {}, env);
    expect(settings.getGlobal).not.toHaveBeenCalled();
    expect(settings.get).not.toHaveBeenCalled();
    expect(wrapper.find('form').exists()).toBe(false);
  });
});

describe('audit extension contracts', () => {
  it('inserts backend audit properties before application contributors', () => {
    const key = AuditLoggingComponents.AuditLogs;
    const seen: string[][] = [];
    const env = environment({
      entityPropContributors: {
        [key]: [
          list => {
            seen.push(list.toArray().map(prop => prop.name));
          },
        ],
      },
    });
    env.config.setState({
      ...env.config.snapshot(),
      objectExtensions: {
        modules: {
          AuditLogging: {
            entities: {
              AuditLog: {
                properties: {
                  ServerProperty: {
                    type: 'System.String',
                    typeSimple: 'string',
                    ui: { onTable: { isVisible: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    env.injector.runInContext(auditLoggingExtensionsResolver);
    expect(
      env.injector
        .get(ExtensionsService)
        .entityProps.get(key)
        .props.toArray()
        .map(prop => prop.name),
    ).toContain('ServerProperty');
    expect(seen.at(-1)).toContain('ServerProperty');
    expect(
      env.injector.get(ExtensionsService).entityProps.get(key).props.toArray().at(-1)?.isExtra,
    ).toBe(true);
  });
  it('preserves canonical keys and routes with authentication, policy and feature guards', () => {
    const env = environment();
    const routes = createAuditLoggingRoutes();
    expect(routes[0]?.path).toBe('/audit-logs');
    expect(routes[0]?.meta).toMatchObject({
      requiresAuthentication: true,
      requiredPolicy: 'AuditLogging.AuditLogs',
    });
    expect(routes[0]?.children?.[0]?.meta?.replaceableComponent?.key).toBe(
      'AuditLogging.AuditLogsComponent',
    );
    expect(env.injector.runInContext(auditLoggingGuard)).toBe(true);
    env.config.setState({
      ...env.config.snapshot(),
      features: { values: { 'AuditLogging.Enable': 'false' } },
    });
    expect(env.injector.runInContext(auditLoggingGuard)).toBe(false);
    expect(provideAuditLoggingConfig()).toBeDefined();
  });
  it('applies all three typed contributor categories after defaults without duplicating them', () => {
    const key = AuditLoggingComponents.AuditLogs;
    const env = environment({
      entityPropContributors: {
        [key]: [
          list =>
            list.addTail(
              EntityProp.create<AuditLogDto>({ name: 'clientName', type: PropType.String }),
            ),
        ],
      },
      entityActionContributors: {
        [key]: [
          list =>
            list.addTail(
              EntityAction.create<AuditLogDto>({ text: 'Host detail', action: () => {} }),
            ),
        ],
        [AuditLoggingComponents.EntityChanges]: [
          list =>
            list.addTail(
              EntityAction.create<EntityChangeDto>({ text: 'Host history', action: () => {} }),
            ),
        ],
      },
      toolbarActionContributors: {
        [key]: [
          list =>
            list.addTail(
              ToolbarAction.create<readonly AuditLogDto[]>({
                text: 'Host export',
                action: () => {},
              }),
            ),
        ],
      },
    });
    const extensions = env.injector.get(ExtensionsService);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      env.injector.runInContext(auditLoggingExtensionsResolver);
      expect(extensions.entityProps.get(key).props.toArray()).toHaveLength(7);
      expect(
        extensions.entityActions
          .get(key)
          .actions.toArray()
          .map(item => item.text),
      ).toEqual(['AbpAuditLogging::Detail', 'Host detail']);
      expect(
        extensions.entityActions
          .get(AuditLoggingComponents.EntityChanges)
          .actions.toArray()
          .map(item => item.text),
      ).toEqual([
        'AbpAuditLogging::ChangeDetails',
        'AbpAuditLogging::FullChangeHistory',
        'Host history',
      ]);
      expect(extensions.toolbarActions.get(key).actions.toArray()).toHaveLength(1);
    }
  });
});
