import { EntityProp, ExtensionsService, PropType, ToolbarAction } from '@lsw-abpvue/components';
import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  inject,
  LocalizationService,
  SessionStateService,
  WindowService,
  type ApplicationConfigurationDto,
  type Injector,
} from '@lsw-abpvue/core';
import { GdprRequestService, type GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { GdprComponents } from '../enums/components.js';
import { provideGdpr } from '../providers/gdpr.provider.js';
import { gdprExtensionsResolver } from '../resolvers/extensions.resolver.js';
import type { GdprConfigOptions } from '../tokens/extensions.token.js';
import { GDPR_PAGE, type GdprPage } from '../tokens/page.token.js';
import AbpGdprPage from './AbpGdprPage.vue';

const key = GdprComponents.PersonalData;
const ready: GdprRequestDto = {
  id: 'ready-request',
  creationTime: '2026-01-01T00:00:00Z',
  readyTime: '2026-01-01T00:01:00Z',
};
const preparing: GdprRequestDto = {
  id: 'pending-request',
  creationTime: ready.creationTime,
  readyTime: '2099-01-01T00:00:00Z',
};
const wrappers: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

async function settle(): Promise<void> {
  await flushPromises();
  await nextTick();
}

async function render(
  overrides: Partial<GdprRequestService> = {},
  options: GdprConfigOptions = {},
  state: ApplicationConfigurationDto = {},
) {
  const blob = new Blob(['personal data']);
  const service = {
    apiName: 'Gdpr',
    getList: vi.fn(async () => ({ items: [ready, preparing], totalCount: 2 })),
    isNewRequestAllowed: vi.fn(async () => true),
    prepareUserData: vi.fn(async () => {}),
    deleteUserData: vi.fn(async () => {}),
    getDownloadToken: vi.fn(async () => ({ token: 'download-token' })),
    getUserData: vi.fn(async () => blob),
    ...overrides,
  } satisfies GdprRequestService;
  const downloadBlob = vi.fn();
  const injector = createInjector([
    ...plainTheme.providers,
    ...provideGdpr(options),
    { provide: GdprRequestService, useValue: service },
    { provide: WindowService, useValue: { downloadBlob } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'user-1', isAuthenticated: true },
    ...state,
  });
  vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(value =>
    typeof value === 'string' ? value : (value.key ?? ''),
  );
  const page = mount(AbpGdprPage, {
    global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (value: string) => value } },
  });
  wrappers.push(page);
  await settle();
  const button = (text: string) => {
    const found = page.findAll('button').find(button => button.text() === text);
    if (!found) throw new TypeError(`No button is labelled ${text}.`);
    return found;
  };
  const click = async (text: string) => {
    await button(text).trigger('click');
    await settle();
  };
  return { page, config, injector, service, blob, downloadBlob, button, click };
}

describe('personal data', () => {
  it('assembles backend columns before host contributors and rechecks their policies', async () => {
    const seen: string[][] = [];
    const row = { ...ready, extraProperties: { ServerExtra: 'server-value' } };
    const { page, config } = await render(
      { getList: vi.fn(async () => ({ items: [row], totalCount: 1 })) },
      {
        createFormPropContributors: {
          [key]: [
            props => {
              seen.push(props.toArray().map(prop => prop.name));
            },
          ],
        },
      },
      {
        auth: { grantedPolicies: { 'Example.ViewExtra': true } },
        objectExtensions: {
          modules: {
            Gdpr: {
              entities: {
                PersonalData: {
                  properties: {
                    ServerExtra: {
                      type: 'System.String',
                      typeSimple: 'string',
                      ui: { onTable: { isVisible: true } },
                      policy: {
                        permissions: { permissionNames: ['Example.ViewExtra'], requiresAll: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    );
    expect(seen.at(-1)).toEqual(['action', 'creationTime', 'readyTime', 'ServerExtra']);
    expect(page.text()).toContain('server-value');
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    await settle();
    expect(page.text()).not.toContain('server-value');
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'Example.ViewExtra': true } },
    });
    await settle();
    expect(page.text()).toContain('server-value');
    expect(seen.at(-1)).toEqual(['action', 'creationTime', 'readyTime', 'ServerExtra']);
  });

  it('loads only the signed-in user and shows preparing and download states', async () => {
    const { page, service } = await render();
    expect(service.getList).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', skipCount: 0, maxResultCount: 10 }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(page.text()).toContain('AbpGdpr::PersonalDataDescription');
    expect(page.text()).not.toContain('2026-01-01T');
    expect(page.find('[role="status"]').text()).toBe('AbpGdpr::Preparing');
    expect(
      page.findAll('button').filter(button => button.text() === 'AbpGdpr::Download'),
    ).toHaveLength(1);
    expect(page.find('input[type="search"]').exists()).toBe(false);
  });

  it('sends server sorting and pagination', async () => {
    const service = { getList: vi.fn(async () => ({ items: [ready], totalCount: 25 })) };
    const { page } = await render(service);
    const sort = page
      .findAll('button')
      .find(button => button.text().includes('AbpGdpr::CreationTime'));
    if (!sort) throw new TypeError('The creation time sort button is missing.');
    await sort.trigger('click');
    await settle();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ sorting: 'creationTime asc', skipCount: 0 }),
      expect.anything(),
    );
    const next = page.findAll('button').find(button => button.text() === '2');
    if (!next) throw new TypeError('The next page button is missing.');
    await next.trigger('click');
    await settle();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ skipCount: 10 }),
      expect.anything(),
    );
  });

  it('disables the request action while the server disallows it and provides the reason', async () => {
    const { button, service, page } = await render({
      isNewRequestAllowed: vi.fn(async () => false),
    });
    expect(button('AbpGdpr::RequestPersonalData').attributes('disabled')).toBeDefined();
    expect(page.find('[title="AbpGdpr::Volo.Abp.Gdpr:010001"]').exists()).toBe(true);
    expect(service.prepareUserData).not.toHaveBeenCalled();
  });

  it('submits once, reloads the list and rechecks request eligibility', async () => {
    const pending = deferred<void>();
    const prepareUserData = vi.fn(() => pending.promise);
    const { service, click, button } = await render({ prepareUserData });
    await click('AbpGdpr::RequestPersonalData');
    await click('AbpGdpr::RequestPersonalData');
    expect(prepareUserData).toHaveBeenCalledOnce();
    expect(button('AbpGdpr::RequestPersonalData').attributes('disabled')).toBeDefined();
    pending.resolve();
    await settle();
    expect(service.getList).toHaveBeenCalledTimes(2);
    expect(service.isNewRequestAllowed).toHaveBeenCalledTimes(2);
    expect(button('AbpGdpr::RequestPersonalData').attributes('disabled')).toBeUndefined();
  });

  it('recovers from a failed eligibility read through the visible refresh action', async () => {
    const isNewRequestAllowed = vi
      .fn<GdprRequestService['isNewRequestAllowed']>()
      .mockRejectedValueOnce(new TypeError('Unavailable'))
      .mockResolvedValue(true);
    const { page, click, button } = await render({ isNewRequestAllowed });
    expect(page.find('[role="alert"]').exists()).toBe(true);
    expect(button('AbpGdpr::RequestPersonalData').attributes('disabled')).toBeDefined();
    await click('AbpUi::Refresh');
    expect(button('AbpGdpr::RequestPersonalData').attributes('disabled')).toBeUndefined();
    expect(page.find('[role="alert"]').exists()).toBe(false);
  });

  it('retains a failed request for explicit retry without a second automatic write', async () => {
    const prepareUserData = vi
      .fn<GdprRequestService['prepareUserData']>()
      .mockRejectedValueOnce(new TypeError('Unavailable'))
      .mockResolvedValue();
    const { page, click } = await render({ prepareUserData });
    await click('AbpGdpr::RequestPersonalData');
    expect(page.find('[role="alert"]').exists()).toBe(true);
    expect(prepareUserData).toHaveBeenCalledOnce();
    await click('AbpGdpr::RequestPersonalData');
    expect(prepareUserData).toHaveBeenCalledTimes(2);
    expect(page.find('[role="alert"]').exists()).toBe(false);
  });

  it('downloads the selected ready request through a fresh token and a blob', async () => {
    const { click, service, blob, downloadBlob } = await render();
    await click('AbpGdpr::Download');
    expect(service.getDownloadToken).toHaveBeenCalledWith(ready.id, expect.anything());
    expect(service.getUserData).toHaveBeenCalledWith(ready.id, 'download-token', expect.anything());
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'PersonalData');
  });

  it('does not download with an empty token and reports the localized reason', async () => {
    const { click, page, service, downloadBlob } = await render({
      getDownloadToken: vi.fn(async () => ({})),
    });
    await click('AbpGdpr::Download');
    expect(page.find('[role="alert"]').text()).toContain('AbpGdpr::CanNotGetDownloadToken');
    expect(service.getUserData).not.toHaveBeenCalled();
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it('obtains a new token on retry after a download fails', async () => {
    const getUserData = vi
      .fn<GdprRequestService['getUserData']>()
      .mockRejectedValueOnce(new TypeError('Expired'))
      .mockResolvedValue(new Blob());
    const { click, service, downloadBlob } = await render({ getUserData });
    await click('AbpGdpr::Download');
    expect(downloadBlob).not.toHaveBeenCalled();
    await click('AbpGdpr::Download');
    expect(service.getDownloadToken).toHaveBeenCalledTimes(2);
    expect(downloadBlob).toHaveBeenCalledOnce();
  });

  it('requires confirmation and shows the deletion request receipt', async () => {
    const { click, injector, service } = await render();
    const confirmation = injector.get(ConfirmationService);
    await click('AbpGdpr::DeletePersonalData');
    expect(confirmation.current.value?.message).toBe('AbpGdpr::DeletePersonalDataWarning');
    expect(service.deleteUserData).not.toHaveBeenCalled();
    confirmation.clear(ConfirmationStatus.reject);
    await settle();
    expect(service.deleteUserData).not.toHaveBeenCalled();
    await click('AbpGdpr::DeletePersonalData');
    confirmation.clear(ConfirmationStatus.confirm);
    await settle();
    expect(service.deleteUserData).toHaveBeenCalledOnce();
    expect(service.getList).toHaveBeenCalledTimes(2);
    expect(confirmation.current.value?.message).toBe('AbpGdpr::PersonalDataDeleteRequestReceived');
  });

  it('cancels deletion confirmation when the identity changes', async () => {
    const { click, injector, config, service } = await render();
    await click('AbpGdpr::DeletePersonalData');
    config.setState({
      ...config.snapshot(),
      currentUser: { ...config.snapshot().currentUser, id: 'user-2', isAuthenticated: true },
    });
    await settle();
    expect(injector.get(ConfirmationService).current.value).toBeNull();
    expect(service.deleteUserData).not.toHaveBeenCalled();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: 'user-2' }),
      expect.anything(),
    );
  });

  it('cancels the current confirmation after an earlier identity has been replaced', async () => {
    const workflows: GdprPage[] = [];
    const component = defineComponent(() => {
      workflows.push(inject(GDPR_PAGE));
      return () => null;
    });
    const { injector, config, service } = await render(
      {},
      {
        toolbarActionContributors: {
          [key]: [
            actions =>
              actions.addTail(
                ToolbarAction.create({
                  text: 'Host.Workflow',
                  component,
                  action: () => {},
                }),
              ),
          ],
        },
      },
    );
    const workflow = workflows[0];
    if (!workflow) throw new TypeError('The contributed workflow is unavailable.');
    void workflow.deleteData();
    config.setState({
      ...config.snapshot(),
      currentUser: { ...config.snapshot().currentUser, id: 'user-2' },
    });
    void workflow.deleteData();
    await settle();
    expect(injector.get(ConfirmationService).current.value?.message).toBe(
      'AbpGdpr::DeletePersonalDataWarning',
    );
    config.setState({
      ...config.snapshot(),
      currentUser: { ...config.snapshot().currentUser, isAuthenticated: false },
    });
    await settle();
    expect(injector.get(ConfirmationService).current.value).toBeNull();
    expect(service.deleteUserData).not.toHaveBeenCalled();
  });

  it('drops stale list responses and blocks calls during a tenant transition', async () => {
    const pending = deferred<{ items: GdprRequestDto[]; totalCount: number }>();
    const { injector, service, page } = await render({ getList: vi.fn(() => pending.promise) });
    injector.get(SessionStateService).setTenant({ id: 'other-tenant', isAvailable: true });
    await settle();
    pending.resolve({ items: [ready], totalCount: 1 });
    await settle();
    expect(page.text()).toBe('');
    expect(service.getList).toHaveBeenCalledOnce();
  });

  it.each(['token', 'blob', 'unmount'] as const)(
    'does not download when context is lost at the %s stage',
    async stage => {
      const token = deferred<{ token: string }>();
      const blob = deferred<Blob>();
      const { click, config, service, downloadBlob, page } = await render({
        getDownloadToken: vi.fn(() =>
          stage === 'token' ? token.promise : Promise.resolve({ token: 'token' }),
        ),
        getUserData: vi.fn(() => blob.promise),
      });
      await click('AbpGdpr::Download');
      if (stage === 'unmount') page.unmount();
      else
        config.setState({
          ...config.snapshot(),
          currentUser: { ...config.snapshot().currentUser, isAuthenticated: false },
        });
      token.resolve({ token: 'stale-token' });
      blob.resolve(new Blob());
      await settle();
      if (stage === 'token') expect(service.getUserData).not.toHaveBeenCalled();
      expect(downloadBlob).not.toHaveBeenCalled();
    },
  );

  it('allows host contributors to remove defaults, add columns and handle current records', async () => {
    const custom = vi.fn();
    const { page, click, injector } = await render(
      {},
      {
        createFormPropContributors: {
          [key]: [
            props =>
              props.addTail(
                EntityProp.create({
                  name: 'host',
                  type: PropType.String,
                  valueResolver: data => data.record.id,
                }),
              ),
          ],
        },
        toolbarActionContributors: {
          [key]: [
            actions => {
              actions.dropByIndex(0);
              actions.addTail(
                ToolbarAction.create({ text: 'Host.Action', action: data => custom(data.record) }),
              );
            },
          ],
        },
      },
    );
    expect(page.text()).toContain('ready-request');
    expect(page.text()).not.toContain('AbpGdpr::RequestPersonalData');
    await click('Host.Action');
    expect(custom).toHaveBeenCalledWith([ready, preparing]);
    injector.runInContext(gdprExtensionsResolver);
    expect(
      injector
        .get(ExtensionsService)
        .entityProps.get(key)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['action', 'creationTime', 'readyTime', 'host']);
  });
});
