import {
  ABP_INJECTOR_KEY,
  AuthService,
  ConfigStateService,
  createInjector,
  EventBusService,
  LocalizationService,
  provideAbpCore,
  StorageService,
  withOptions,
  type Injector,
} from '@lsw-abpvue/core';
import {
  SAAS_CONNECTION_STRING_SETTING,
  SaasEvents,
  SaasPolicyNames,
  type SaasEventContext,
} from '@lsw-abpvue/saas/config';
import {
  EditionService,
  TenantActivationState,
  TenantService,
  type EditionDto,
  type SaasTenantDto,
} from '@lsw-abpvue/saas/proxy';
import { ConfirmationService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed, type Component } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { provideSaas } from '../providers/saas.provider.js';
import type { SaasConfigOptions } from '../models/config-options.js';
import { saasExtensionsResolver } from '../resolvers/extensions.resolver.js';
import EditionsPage from './EditionsPage.vue';
import EditionsUsageWidget from './EditionsUsageWidget.vue';
import EditionTenantsDialog from './EditionTenantsDialog.vue';
import LatestTenantsWidget from './LatestTenantsWidget.vue';
import TenantsPage from './TenantsPage.vue';

const tenant: SaasTenantDto = {
  id: 'tenant-1',
  name: 'Example Tenant',
  editionId: 'edition-1',
  editionName: 'Standard',
  activationState: TenantActivationState.Active,
  hasDefaultConnectionString: false,
};
const edition: EditionDto = { id: 'edition-1', displayName: 'Standard', tenantCount: 2 };
const context: SaasEventContext = { userId: 'host-user', tenantId: null };
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
});

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(finish => {
    resolve = finish;
  });
  return { promise, resolve };
}

function setup(options: SaasConfigOptions = {}) {
  const tenants = {
    getList: vi.fn<TenantService['getList']>(async () => ({ items: [tenant], totalCount: 1 })),
    get: vi.fn<TenantService['get']>(async () => ({ ...tenant })),
    create: vi.fn<TenantService['create']>(async () => ({ ...tenant })),
    update: vi.fn<TenantService['update']>(async () => ({ ...tenant })),
    delete: vi.fn<TenantService['delete']>(async () => {}),
    getEditionLookup: vi.fn<TenantService['getEditionLookup']>(async () => [edition]),
    getDatabases: vi.fn<TenantService['getDatabases']>(async () => ({ databases: [] })),
    getConnectionStrings: vi.fn<TenantService['getConnectionStrings']>(async () => ({
      default: '',
      databases: [],
    })),
    updateConnectionStrings: vi.fn<TenantService['updateConnectionStrings']>(async () => {}),
    applyDatabaseMigrations: vi.fn<TenantService['applyDatabaseMigrations']>(async () => {}),
    setPassword: vi.fn<TenantService['setPassword']>(async () => {}),
    inviteUser: vi.fn<TenantService['inviteUser']>(async () => {}),
  };
  const editions = {
    getList: vi.fn<EditionService['getList']>(async () => ({ items: [edition], totalCount: 1 })),
    get: vi.fn<EditionService['get']>(async () => ({ ...edition })),
    create: vi.fn<EditionService['create']>(async () => ({ ...edition })),
    update: vi.fn<EditionService['update']>(async () => ({ ...edition })),
    delete: vi.fn<EditionService['delete']>(async () => {}),
    getAllList: vi.fn<EditionService['getAllList']>(async () => [
      edition,
      { id: 'edition-2', displayName: 'Premium', tenantCount: 0 },
    ]),
    getPlanLookup: vi.fn<EditionService['getPlanLookup']>(async () => []),
    getUsageStatistics: vi.fn<EditionService['getUsageStatistics']>(async () => ({
      data: { Standard: 2 },
    })),
    moveAllTenants: vi.fn<EditionService['moveAllTenants']>(async () => {}),
  };
  const storage = new Map<string, string>();
  const confirmation = vi.fn(async () => 'confirm');
  const injector = createInjector([
    provideAbpCore(
      withOptions({
        environment: {
          apis: { default: { url: '' } },
          application: { name: 'Events test' },
          production: false,
        },
      }),
    ),
    ...plainTheme.providers,
    ...provideSaas(options),
    {
      provide: AuthService,
      useValue: { isAuthenticated: computed(() => true) } as unknown as AuthService,
    },
    { provide: TenantService, useValue: tenants as unknown as TenantService },
    { provide: EditionService, useValue: editions as unknown as EditionService },
    {
      provide: ConfirmationService,
      useValue: { warn: confirmation } as unknown as ConfirmationService,
    },
    {
      provide: StorageService,
      useValue: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
        keys: () => [...storage.keys()],
        onChange: () => () => {},
      },
    },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    currentUser: { ...state.currentUser, id: context.userId, isAuthenticated: true },
    currentTenant: { id: null, isAvailable: true },
    auth: {
      grantedPolicies: Object.fromEntries(Object.values(SaasPolicyNames).map(name => [name, true])),
    },
    localization: {
      ...state.localization,
      currentCulture: { ...state.localization.currentCulture, cultureName: 'en' },
      resources: Object.fromEntries(
        ['Saas', 'AbpUi', 'AbpValidation', 'AbpIdentity', 'AbpAccount'].map(name => [
          name,
          { texts: {} },
        ]),
      ),
    },
  });
  injector.runInContext(saasExtensionsResolver);
  const localization = injector.get(LocalizationService);
  const bus = injector.get(EventBusService);
  const tenantEvents = vi.fn();
  const editionEvents = vi.fn();
  bus.on(SaasEvents.TenantsChanged, tenantEvents);
  bus.on(SaasEvents.EditionsChanged, editionEvents);

  async function render(component: Component, props: Record<string, unknown> = {}) {
    const wrapper = mount(component, {
      props,
      global: {
        provide: { [ABP_INJECTOR_KEY]: injector },
        mocks: { $t: localization.t },
        stubs: { RouterLink: true },
      },
    });
    wrappers.push(wrapper);
    await flushPromises();
    return wrapper;
  }
  return { tenants, editions, config, bus, tenantEvents, editionEvents, render, confirmation };
}

async function click(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('button').findLast(item => item.text() === label);
  expect(button, `Missing button: ${label}`).toBeDefined();
  await button?.trigger('click');
  await flushPromises();
}

async function fillTenantCreate(page: VueWrapper, name: string) {
  await page.get('input[name="name"]').setValue(name);
  await page.get('input[name="adminEmailAddress"]').setValue('admin@example.test');
  await page.get('input[name="adminPassword"]').setValue('1q2w3E*');
}

const widgetCases = [
  { name: 'latest tenants', kind: 'tenants', component: LatestTenantsWidget },
  { name: 'edition usage', kind: 'editions', component: EditionsUsageWidget },
] as const;
type WidgetKind = (typeof widgetCases)[number]['kind'];
type TestContext = ReturnType<typeof setup>;

function widgetQuery(api: TestContext, kind: WidgetKind) {
  return kind === 'tenants' ? api.tenants.getList : api.editions.getUsageStatistics;
}

function widgetData(api: TestContext, kind: WidgetKind, name: string) {
  if (kind === 'tenants')
    api.tenants.getList.mockResolvedValue({ items: [{ ...tenant, name }], totalCount: 1 });
  else api.editions.getUsageStatistics.mockResolvedValue({ data: { [name]: 3 } });
}

function pendingWidget(api: TestContext, kind: WidgetKind) {
  const pending = deferred<string>();
  if (kind === 'tenants')
    api.tenants.getList.mockImplementationOnce(async () => ({
      items: [{ ...tenant, name: await pending.promise }],
      totalCount: 1,
    }));
  else
    api.editions.getUsageStatistics.mockImplementationOnce(async () => ({
      data: { [await pending.promise]: 3 },
    }));
  return pending;
}

describe.each(widgetCases)('$name event refresh', ({ kind, component }) => {
  it('loads initially and displays fresh data for both event contracts', async () => {
    const api = setup();
    const widget = await api.render(component);
    expect(widgetQuery(api, kind)).toHaveBeenCalledOnce();
    widgetData(api, kind, 'After tenant write');
    api.bus.emit(SaasEvents.TenantsChanged, {
      context,
      reason: 'updated',
      tenantIds: ['tenant-1'],
    });
    await flushPromises();
    expect(widget.text()).toContain('After tenant write');
    widgetData(api, kind, 'After edition write');
    api.bus.emit(SaasEvents.EditionsChanged, {
      context,
      reason: 'updated',
      editionId: 'edition-1',
    });
    await flushPromises();
    expect(widget.text()).toContain('After edition write');
    expect(widgetQuery(api, kind)).toHaveBeenCalledTimes(3);
  });

  it('coalesces notifications received while a query is running and keeps public draw', async () => {
    const api = setup();
    const pending = pendingWidget(api, kind);
    const widget = await api.render(component);
    const initialized = widget.emitted('initialized')?.[0]?.[0] as { draw(): Promise<void> };
    widgetData(api, kind, 'Latest result');
    api.bus.emit(SaasEvents.TenantsChanged, { context, reason: 'created' });
    api.bus.emit(SaasEvents.EditionsChanged, { context, reason: 'deleted' });
    const drawing = initialized.draw();
    expect(widgetQuery(api, kind)).toHaveBeenCalledOnce();
    pending.resolve('Old result');
    await drawing;
    await flushPromises();
    expect(widgetQuery(api, kind)).toHaveBeenCalledTimes(2);
    expect(widget.text()).toContain('Latest result');
    expect(widget.text()).not.toContain('Old result');
  });

  it('ignores unrelated contexts and stops refreshing without read permission', async () => {
    const api = setup();
    const widget = await api.render(component);
    api.bus.emit(SaasEvents.TenantsChanged, {
      context: { ...context, userId: 'other' },
      reason: 'updated',
    });
    api.bus.emit(SaasEvents.EditionsChanged, {
      context: { ...context, tenantId: 'other' },
      reason: 'updated',
    });
    await flushPromises();
    expect(widgetQuery(api, kind)).toHaveBeenCalledOnce();
    api.config.setState({ ...api.config.snapshot(), auth: { grantedPolicies: {} } });
    api.bus.emit(SaasEvents.TenantsChanged, { context, reason: 'deleted' });
    await flushPromises();
    expect(widgetQuery(api, kind)).toHaveBeenCalledOnce();
    expect(widget.find('section').exists()).toBe(false);
  });

  it('starts a new context immediately and preserves its pending refresh after a late old response', async () => {
    const api = setup();
    const old = pendingWidget(api, kind);
    const widget = await api.render(component);
    const current = pendingWidget(api, kind);
    const snapshot = api.config.snapshot();
    api.config.setState({ ...snapshot, currentUser: { ...snapshot.currentUser, id: 'new-user' } });
    await flushPromises();
    expect(widgetQuery(api, kind)).toHaveBeenCalledTimes(2);
    old.resolve('Wrong identity');
    await flushPromises();
    widgetData(api, kind, 'Newest identity result');
    api.bus.emit(SaasEvents.TenantsChanged, {
      context: { ...context, userId: 'new-user' },
      reason: 'updated',
    });
    expect(widgetQuery(api, kind)).toHaveBeenCalledTimes(2);
    current.resolve('Current identity result');
    await flushPromises();
    expect(widget.text()).toContain('Newest identity result');
    expect(widget.text()).not.toContain('Wrong identity');
    expect(widgetQuery(api, kind)).toHaveBeenCalledTimes(3);
  });

  it('drops queued notifications and unsubscribes on unmount', async () => {
    const api = setup();
    const pending = pendingWidget(api, kind);
    const widget = await api.render(component);
    api.bus.emit(SaasEvents.TenantsChanged, { context, reason: 'updated' });
    widget.unmount();
    api.bus.emit(SaasEvents.EditionsChanged, { context, reason: 'updated' });
    pending.resolve('Late result');
    await flushPromises();
    expect(widgetQuery(api, kind)).toHaveBeenCalledOnce();
  });

  it('recovers from a failed query on the next notification', async () => {
    const api = setup();
    widgetQuery(api, kind).mockRejectedValueOnce(new TypeError('read failed'));
    const widget = await api.render(component);
    expect(widget.find('[role="alert"]').exists()).toBe(true);
    widgetData(api, kind, 'Recovered');
    api.bus.emit(SaasEvents.TenantsChanged, { context, reason: 'updated' });
    await flushPromises();
    expect(widget.text()).toContain('Recovered');
    expect(widget.find('[role="alert"]').exists()).toBe(false);
  });
});

describe('SaaS mutation notifications', () => {
  it('publishes confirmed tenant creation, update and deletion and refreshes independent widgets', async () => {
    const api = setup();
    const page = await api.render(TenantsPage);
    const latest = await api.render(LatestTenantsWidget);
    const usage = await api.render(EditionsUsageWidget);
    await click(page, 'NewTenant');
    await click(page, 'Save');
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.tenants.create).not.toHaveBeenCalled();
    await fillTenantCreate(page, 'Created tenant');
    widgetData(api, 'tenants', 'Created tenant');
    widgetData(api, 'editions', 'New edition usage');
    await click(page, 'Save');
    expect(api.tenantEvents).toHaveBeenLastCalledWith({
      context,
      reason: 'created',
      tenantIds: ['tenant-1'],
    });
    expect(latest.text()).toContain('Created tenant');
    expect(usage.text()).toContain('New edition usage');
    await click(page, 'Edit');
    await page.get('input[name="name"]').setValue('Updated tenant');
    await click(page, 'Save');
    expect(api.tenantEvents).toHaveBeenLastCalledWith({
      context,
      reason: 'updated',
      tenantIds: ['tenant-1'],
    });
    await click(page, 'Delete');
    expect(api.tenantEvents).toHaveBeenLastCalledWith({
      context,
      reason: 'deleted',
      tenantIds: ['tenant-1'],
    });
    expect(api.tenantEvents).toHaveBeenCalledTimes(3);
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('publishes confirmed edition creation and updates', async () => {
    const api = setup();
    const page = await api.render(EditionsPage);
    await click(page, 'NewEdition');
    await page.get('input[name="displayName"]').setValue('New edition');
    await click(page, 'Save');
    expect(api.editionEvents).toHaveBeenLastCalledWith({
      context,
      reason: 'created',
      editionId: 'edition-1',
    });
    await click(page, 'Edit');
    await page.get('input[name="displayName"]').setValue('Renamed edition');
    await click(page, 'Save');
    expect(api.editionEvents).toHaveBeenLastCalledWith({
      context,
      reason: 'updated',
      editionId: 'edition-1',
    });
    expect(api.editionEvents).toHaveBeenCalledTimes(2);
    expect(api.tenantEvents).not.toHaveBeenCalled();
  });

  it('retains a failed tenant edit without publishing and rejects late writes after an identity switch', async () => {
    const api = setup();
    const page = await api.render(TenantsPage);
    await click(page, 'Edit');
    await page.get('input[name="name"]').setValue('Retry name');
    api.tenants.update.mockRejectedValueOnce(new TypeError('write failed'));
    await click(page, 'Save');
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(page.get('input[name="name"]').element).toHaveProperty('value', 'Retry name');
    const pending = deferred<SaasTenantDto>();
    api.tenants.update.mockReturnValueOnce(pending.promise);
    await click(page, 'Save');
    const snapshot = api.config.snapshot();
    api.config.setState({
      ...snapshot,
      currentUser: { ...snapshot.currentUser, id: 'other-user' },
    });
    pending.resolve({ ...tenant, name: 'Late saved name' });
    await flushPromises();
    expect(api.tenantEvents).not.toHaveBeenCalled();
  });

  it('does not publish a rejected edition write or a cancelled tenant deletion', async () => {
    const api = setup();
    const editions = await api.render(EditionsPage);
    await click(editions, 'Edit');
    await editions.get('input[name="displayName"]').setValue('Rejected name');
    api.editions.update.mockRejectedValueOnce(new TypeError('write failed'));
    await click(editions, 'Save');
    expect(api.editionEvents).not.toHaveBeenCalled();
    const tenants = await api.render(TenantsPage);
    api.confirmation.mockResolvedValueOnce('reject');
    await click(tenants, 'Delete');
    expect(api.tenants.delete).not.toHaveBeenCalled();
    expect(api.tenantEvents).not.toHaveBeenCalled();
  });

  it('notifies a successful move despite deletion failure and does not repeat the move on retry', async () => {
    const api = setup();
    const latest = await api.render(LatestTenantsWidget);
    const usage = await api.render(EditionsUsageWidget);
    const dialog = await api.render(EditionTenantsDialog, { edition, mode: 'delete' });
    await dialog.get('input[type="checkbox"]').setValue(true);
    await dialog.get('select').setValue('edition-2');
    api.editions.delete.mockRejectedValueOnce(new TypeError('delete failed'));
    widgetData(api, 'tenants', 'After moved tenants');
    widgetData(api, 'editions', 'Premium');
    await click(dialog, 'Delete');
    expect(api.tenantEvents).toHaveBeenCalledExactlyOnceWith({ context, reason: 'editionChanged' });
    expect(api.editionEvents).not.toHaveBeenCalled();
    expect(latest.text()).toContain('After moved tenants');
    expect(usage.text()).toContain('Premium');
    api.editions.get.mockResolvedValue({ ...edition, tenantCount: 0 });
    await click(dialog, 'Refresh');
    await click(dialog, 'Delete');
    expect(api.editions.moveAllTenants).toHaveBeenCalledOnce();
    expect(api.tenantEvents).toHaveBeenCalledOnce();
    expect(api.editionEvents).toHaveBeenCalledExactlyOnceWith({
      context,
      reason: 'deleted',
      editionId: 'edition-1',
    });
    expect(dialog.emitted('saved')).toHaveLength(1);
  });

  it('publishes an edition deletion without a move and does not invent tenant identifiers', async () => {
    const api = setup();
    api.editions.get.mockResolvedValue({ ...edition, tenantCount: 0 });
    const dialog = await api.render(EditionTenantsDialog, { edition, mode: 'delete' });
    await click(dialog, 'Delete');
    expect(api.editionEvents).toHaveBeenCalledExactlyOnceWith({
      context,
      reason: 'deleted',
      editionId: 'edition-1',
    });
    expect(api.tenantEvents).not.toHaveBeenCalled();
  });

  it('does not publish or continue deleting after a move completes in an obsolete context', async () => {
    const api = setup();
    const pending = deferred<void>();
    api.editions.moveAllTenants.mockReturnValueOnce(pending.promise);
    const dialog = await api.render(EditionTenantsDialog, { edition, mode: 'delete' });
    await dialog.get('input[type="checkbox"]').setValue(true);
    await dialog.get('select').setValue('edition-2');
    await click(dialog, 'Delete');
    api.config.setState({
      ...api.config.snapshot(),
      currentTenant: { id: 'other-tenant', isAvailable: true },
    });
    pending.resolve();
    await flushPromises();
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
    expect(api.editions.delete).not.toHaveBeenCalled();
  });

  it('publishes a standalone tenant transfer without announcing edition deletion', async () => {
    const api = setup();
    const dialog = await api.render(EditionTenantsDialog, { edition, mode: 'move' });
    await click(dialog, 'Save');
    expect(api.editions.moveAllTenants).toHaveBeenCalledWith('edition-1', null, expect.anything());
    expect(api.tenantEvents).toHaveBeenCalledExactlyOnceWith({ context, reason: 'editionChanged' });
    expect(api.editionEvents).not.toHaveBeenCalled();
    expect(api.editions.delete).not.toHaveBeenCalled();
  });

  it('does not announce invalid transfers or empty source editions', async () => {
    const api = setup();
    const deletion = await api.render(EditionTenantsDialog, { edition, mode: 'delete' });
    await deletion.get('input[type="checkbox"]').setValue(true);
    await click(deletion, 'Delete');
    expect(deletion.text()).toContain('ThisFieldIsRequired.');
    expect(api.editions.moveAllTenants).not.toHaveBeenCalled();
    expect(api.editions.delete).not.toHaveBeenCalled();
    api.editions.get.mockResolvedValue({ ...edition, tenantCount: 0 });
    const moving = await api.render(EditionTenantsDialog, { edition, mode: 'move' });
    await click(moving, 'Save');
    expect(moving.text()).toContain('ThereIsNoTenantsCurrentlyInThisEdition');
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('does not announce a rejected transfer and retries after reloading', async () => {
    const api = setup();
    api.editions.moveAllTenants.mockRejectedValueOnce(new TypeError('move rejected'));
    const dialog = await api.render(EditionTenantsDialog, { edition, mode: 'move' });
    await click(dialog, 'Save');
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(dialog.find('[role="alert"]').exists()).toBe(true);
    await click(dialog, 'Refresh');
    await click(dialog, 'Save');
    expect(api.tenantEvents).toHaveBeenCalledOnce();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('preserves the confirmed transfer if a subscriber switches identity before deletion', async () => {
    const api = setup();
    api.bus.on(SaasEvents.TenantsChanged, () => {
      const state = api.config.snapshot();
      api.config.setState({ ...state, currentUser: { ...state.currentUser, id: 'new-user' } });
    });
    const dialog = await api.render(EditionTenantsDialog, { edition, mode: 'delete' });
    await dialog.get('input[type="checkbox"]').setValue(true);
    await dialog.get('select').setValue('edition-2');
    await click(dialog, 'Delete');
    expect(api.tenantEvents).toHaveBeenCalledExactlyOnceWith({ context, reason: 'editionChanged' });
    expect(api.editions.delete).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('discards a deletion response after its publishing context has changed', async () => {
    const api = setup();
    const pending = deferred<void>();
    api.editions.delete.mockReturnValueOnce(pending.promise);
    const dialog = await api.render(EditionTenantsDialog, { edition, mode: 'delete' });
    await click(dialog, 'Delete');
    api.config.setState({ ...api.config.snapshot(), auth: { grantedPolicies: {} } });
    pending.resolve();
    await flushPromises();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('does not publish before tenant validators finish or when they refuse the write', async () => {
    const validation = deferred<null>();
    let valid = false;
    const api = setup({
      tenantFormValidators: [
        () => (valid ? null : [{ message: 'Rejected tenant name', members: ['name'] }]),
      ],
      tenantFormAsyncValidators: [() => validation.promise],
    });
    const page = await api.render(TenantsPage);
    await click(page, 'Edit');
    await page.get('input[name="name"]').setValue('Validated tenant');
    await click(page, 'Save');
    expect(api.tenants.update).not.toHaveBeenCalled();
    expect(api.tenantEvents).not.toHaveBeenCalled();
    validation.resolve(null);
    await flushPromises();
    expect(page.text()).toContain('Rejected tenant name');
    expect(api.tenantEvents).not.toHaveBeenCalled();
    valid = true;
    await page.get('input[name="name"]').setValue('Accepted tenant');
    await click(page, 'Save');
    expect(api.tenants.update).toHaveBeenCalledOnce();
    expect(api.tenantEvents).toHaveBeenCalledOnce();
  });

  it('does not write after the context changes while asynchronous validation is pending', async () => {
    const validation = deferred<null>();
    const api = setup({ tenantFormAsyncValidators: [() => validation.promise] });
    const page = await api.render(TenantsPage);
    await click(page, 'Edit');
    await page.get('input[name="name"]').setValue('Obsolete tenant');
    await click(page, 'Save');
    api.config.setState({
      ...api.config.snapshot(),
      currentTenant: { id: 'other', isAvailable: true },
    });
    validation.resolve(null);
    await flushPromises();
    expect(api.tenants.update).not.toHaveBeenCalled();
    expect(api.tenantEvents).not.toHaveBeenCalled();
  });

  it('does not delete after its confirmation belongs to an obsolete identity', async () => {
    const api = setup();
    const confirmation = deferred<string>();
    api.confirmation.mockReturnValueOnce(confirmation.promise);
    const page = await api.render(TenantsPage);
    await click(page, 'Delete');
    const state = api.config.snapshot();
    api.config.setState({ ...state, currentUser: { ...state.currentUser, id: 'other' } });
    confirmation.resolve('confirm');
    await flushPromises();
    expect(api.tenants.delete).not.toHaveBeenCalled();
    expect(api.tenantEvents).not.toHaveBeenCalled();
  });

  it('does not confuse connection validation with confirmed tenant creation', async () => {
    const api = setup();
    api.config.setState({
      ...api.config.snapshot(),
      setting: { values: { [SAAS_CONNECTION_STRING_SETTING]: 'True' } },
    });
    const page = await api.render(TenantsPage);
    await click(page, 'NewTenant');
    await fillTenantCreate(page, 'Tenant with database');
    const dialog = page.get('[role="dialog"]');
    await dialog.get('input[type="checkbox"]').setValue(false);
    await click(page, 'Save');
    expect(api.tenants.create).not.toHaveBeenCalled();
    expect(api.tenantEvents).not.toHaveBeenCalled();
    await dialog
      .get('input[type="password"]:not([name])')
      .setValue('Server=sample;Database=tenant');
    await click(page, 'Save');
    expect(api.tenants.create).toHaveBeenCalledOnce();
    expect(api.tenantEvents).toHaveBeenCalledExactlyOnceWith({
      context,
      reason: 'created',
      tenantIds: ['tenant-1'],
    });
  });

  it.each(['password', 'invite'] as const)(
    'keeps %s operations outside tenant CRUD notifications',
    async mode => {
      const api = setup();
      const page = await api.render(TenantsPage);
      await click(page, mode === 'password' ? 'SetPassword' : 'InviteUser');
      await page
        .get(mode === 'password' ? 'input[name="password"]' : 'input[name="email"]')
        .setValue(mode === 'password' ? 'Sample1!Password' : 'invited@example.test');
      await click(page, 'Save');
      expect(
        mode === 'password' ? api.tenants.setPassword : api.tenants.inviteUser,
      ).toHaveBeenCalledOnce();
      expect(page.find('[role="dialog"]').exists()).toBe(false);
      expect(api.tenantEvents).not.toHaveBeenCalled();
      expect(api.editionEvents).not.toHaveBeenCalled();
    },
  );

  it('keeps connection string writes outside tenant CRUD notifications', async () => {
    const api = setup();
    api.config.setState({
      ...api.config.snapshot(),
      setting: { values: { [SAAS_CONNECTION_STRING_SETTING]: 'True' } },
    });
    const page = await api.render(TenantsPage);
    await click(page, 'ConnectionStrings');
    const dialog = page.get('[role="dialog"]');
    await dialog.get('input[type="checkbox"]').setValue(false);
    await dialog.get('input[type="password"]').setValue('Server=sample;Database=changed');
    await click(page, 'Save');
    expect(api.tenants.updateConnectionStrings).toHaveBeenCalledOnce();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('does not describe a queued database migration as a completed tenant change', async () => {
    const api = setup();
    api.tenants.getList.mockResolvedValue({
      items: [{ ...tenant, hasDefaultConnectionString: true }],
      totalCount: 1,
    });
    api.config.setState({
      ...api.config.snapshot(),
      setting: { values: { [SAAS_CONNECTION_STRING_SETTING]: 'True' } },
    });
    const page = await api.render(TenantsPage);
    await click(page, 'ApplyDatabaseMigrations');
    expect(api.tenants.applyDatabaseMigrations).toHaveBeenCalledOnce();
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });
});

describe.each([
  { name: 'tenant', component: TenantsPage, field: 'name', value: 'Example Tenant' },
  { name: 'edition', component: EditionsPage, field: 'displayName', value: 'Standard' },
])('$name publishing boundaries', ({ name, component, field, value }) => {
  it('only publishes after a failed editor lookup is recovered and saved', async () => {
    const api = setup();
    (name === 'tenant' ? api.tenants.get : api.editions.get).mockRejectedValueOnce(
      new TypeError('lookup failed'),
    );
    const page = await api.render(component);
    await click(page, 'Edit');
    expect(page.find('[role="dialog"] [role="alert"]').exists()).toBe(true);
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
    await click(page, 'Refresh');
    await page.get(`input[name="${field}"]`).setValue('Recovered record');
    await click(page, 'Save');
    expect(name === 'tenant' ? api.tenantEvents : api.editionEvents).toHaveBeenCalledOnce();
  });

  it('rejects an editor lookup for a different record without publishing', async () => {
    const api = setup();
    if (name === 'tenant') api.tenants.get.mockResolvedValue({ ...tenant, id: 'other' });
    else api.editions.get.mockResolvedValue({ ...edition, id: 'other' });
    const page = await api.render(component);
    await click(page, 'Edit');
    expect(page.find('[role="dialog"] [role="alert"]').exists()).toBe(true);
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('discards a list response after read permission has been revoked', async () => {
    const api = setup();
    const pending = deferred<void>();
    if (name === 'tenant')
      api.tenants.getList.mockImplementationOnce(async () => {
        await pending.promise;
        return { items: [tenant], totalCount: 1 };
      });
    else
      api.editions.getList.mockImplementationOnce(async () => {
        await pending.promise;
        return { items: [edition], totalCount: 1 };
      });
    const page = await api.render(component);
    api.config.setState({ ...api.config.snapshot(), auth: { grantedPolicies: {} } });
    pending.resolve();
    await flushPromises();
    expect(page.text()).not.toContain(value);
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });

  it('does not publish an in-flight update after write permission is revoked', async () => {
    const api = setup();
    const pending = deferred<void>();
    if (name === 'tenant')
      api.tenants.update.mockImplementationOnce(async () => {
        await pending.promise;
        return tenant;
      });
    else
      api.editions.update.mockImplementationOnce(async () => {
        await pending.promise;
        return edition;
      });
    const page = await api.render(component);
    await click(page, 'Edit');
    await page.get(`input[name="${field}"]`).setValue('Forbidden record');
    await click(page, 'Save');
    api.config.setState({ ...api.config.snapshot(), auth: { grantedPolicies: {} } });
    pending.resolve();
    await flushPromises();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
    expect(api.tenantEvents).not.toHaveBeenCalled();
    expect(api.editionEvents).not.toHaveBeenCalled();
  });
});
