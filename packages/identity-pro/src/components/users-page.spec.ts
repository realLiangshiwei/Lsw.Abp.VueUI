import {
  ABP_INJECTOR_KEY,
  AbpHttpError,
  ConfigStateService,
  createInjector,
  HTTP_FETCH,
  HttpErrorReporterService,
  WindowService,
  type FetchLike,
  type Injector,
} from '@lsw-abpvue/core';
import {
  IdentityUserService,
  type IdentityUserDto,
  type IdentityRoleDto,
} from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { provideIdentityPro } from '../providers/identity-pro.provider.js';
import { identityProExtensionsResolver } from '../resolvers/extensions.resolver.js';
import UsersPage from './UsersPage.vue';

const user: IdentityUserDto = {
  id: 'test-user',
  userName: 'original',
  email: 'original@example.test',
  name: 'Before',
  phoneNumber: '12345',
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  supportTwoFactor: true,
  twoFactorEnabled: false,
  isActive: true,
  lockoutEnabled: true,
  isLockedOut: false,
  shouldChangePasswordOnNextLogin: true,
  accessFailedCount: 0,
  isExternal: false,
  concurrencyStamp: 'fresh-stamp',
  extraProperties: { HiddenValue: 'preserve' },
};
const mounted: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
});
function api() {
  return {
    getList: vi.fn<IdentityUserService['getList']>(() =>
      Promise.resolve({ items: [user], totalCount: 1 }),
    ),
    get: vi.fn(() => Promise.resolve(user)),
    getRoles: vi.fn<IdentityUserService['getRoles']>(() => Promise.resolve({ items: [] })),
    getAllClaimTypes: vi.fn<IdentityUserService['getAllClaimTypes']>(() => Promise.resolve([])),
    getClaims: vi.fn<IdentityUserService['getClaims']>(() =>
      Promise.resolve([{ userId: user.id, claimType: 'legacy-claim', claimValue: 'keep' }]),
    ),
    updateClaims: vi.fn<IdentityUserService['updateClaims']>(() => Promise.resolve()),
    getOrganizationUnits: vi.fn(() => Promise.resolve([])),
    getAssignableRoles: vi.fn<IdentityUserService['getAssignableRoles']>(() =>
      Promise.resolve({ items: [] }),
    ),
    getAvailableOrganizationUnits: vi.fn(() => Promise.resolve({ items: [] })),
    getRoleLookup: vi.fn(() => Promise.resolve([])),
    getOrganizationUnitLookup: vi.fn(() => Promise.resolve([])),
    findById: vi.fn(() => Promise.resolve(undefined)),
    findByUsername: vi.fn<IdentityUserService['findByUsername']>(() => Promise.resolve(user)),
    findByEmail: vi.fn<IdentityUserService['findByEmail']>(() => Promise.resolve(user)),
    getDownloadToken: vi.fn<IdentityUserService['getDownloadToken']>(() =>
      Promise.resolve({ token: 'synthetic-capability' }),
    ),
    getListAsCsvFile: vi.fn<IdentityUserService['getListAsCsvFile']>(() =>
      Promise.resolve(new Blob(['User name;Email'], { type: 'text/csv' })),
    ),
    getListAsExcelFile: vi.fn<IdentityUserService['getListAsExcelFile']>(() =>
      Promise.resolve(
        new Blob(['synthetic'], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ),
    ),
    getImportUsersSampleFile: vi.fn<IdentityUserService['getImportUsersSampleFile']>(() =>
      Promise.resolve(
        new Blob(['synthetic workbook'], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ),
    ),
    importUsersFromFile: vi.fn<IdentityUserService['importUsersFromFile']>(() =>
      Promise.resolve({
        allCount: 2,
        succeededCount: 1,
        failedCount: 1,
        isAllSucceeded: false,
        invalidUsersDownloadToken: 'synthetic-failed-records',
      }),
    ),
    getImportInvalidUsersFile: vi.fn<IdentityUserService['getImportInvalidUsersFile']>(() =>
      Promise.resolve(
        new Blob(['synthetic workbook'], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ),
    ),
    create: vi.fn<(body: unknown) => Promise<unknown>>(() => Promise.resolve(user)),
    update: vi.fn<(id: string, body: unknown) => Promise<unknown>>(() => Promise.resolve(user)),
    updateRoles: vi.fn<IdentityUserService['updateRoles']>(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  };
}
async function render(service = api(), transport?: FetchLike) {
  const injector = createInjector([
    ...plainTheme.providers,
    ...provideIdentityPro(),
    ...(transport
      ? [{ provide: HTTP_FETCH, useValue: transport }]
      : [{ provide: IdentityUserService, useValue: service }]),
  ]);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    currentUser: { ...state.currentUser, id: 'operator', isAuthenticated: true },
    auth: {
      grantedPolicies: Object.fromEntries(
        ['AbpIdentity.Users', 'AbpIdentity.Users.Create', 'AbpIdentity.Users.Update'].map(key => [
          key,
          true,
        ]),
      ),
    },
  });
  injector.runInContext(identityProExtensionsResolver);
  const wrapper = mount(UsersPage, {
    attachTo: document.body,
    global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (key: string) => key } },
  });
  mounted.push(wrapper);
  injectors.push(injector);
  await flushPromises();
  return { wrapper, service, config, injector };
}
function click(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('button').find(item => item.text().endsWith(label));
  if (!button) throw new Error(`The ${label} button was not rendered.`);
  return button.trigger('click');
}

describe('commercial user editor page', () => {
  it('uses the dedicated role update consumer for a role-only edit and sends an explicit empty selection', async () => {
    const service = api();
    const role: IdentityRoleDto = {
      id: 'managed-role',
      name: 'managed',
      isDefault: false,
      isPublic: true,
      isStatic: false,
      userCount: 1,
      creationTime: '2026-01-01T00:00:00',
    };
    service.getAssignableRoles.mockResolvedValue({ items: [role] });
    service.getRoles.mockResolvedValue({ items: [role] });
    const { wrapper, config } = await render(service);
    config.setState({
      ...config.snapshot(),
      auth: {
        grantedPolicies: {
          ...config.snapshot().auth.grantedPolicies,
          'AbpIdentity.Users.Update.ManageRoles': true,
        },
      },
    });
    await click(wrapper, 'Edit');
    await flushPromises();
    const tab = wrapper.findAll('[role="tab"]').find(item => item.text().startsWith('Roles'));
    if (!tab) throw new TypeError('The authorized roles tab is missing.');
    await tab.trigger('click');
    const label = wrapper.findAll('label').find(item => item.text() === 'managed');
    if (!label) throw new TypeError('The assigned direct role is missing.');
    await label.get('input[type="checkbox"]').setValue(false);
    await click(wrapper, 'Save');
    await flushPromises();
    expect(service.updateRoles).toHaveBeenCalledExactlyOnceWith(
      user.id,
      { roleNames: [] },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(service.update).not.toHaveBeenCalled();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
  it('opens the selected user claims without saving and closes when update permission is removed', async () => {
    const { wrapper, service, config } = await render();
    await click(wrapper, 'Claims');
    await flushPromises();
    expect(service.getClaims).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(service.getAllClaimTypes).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('legacy-claim');
    expect(service.updateClaims).not.toHaveBeenCalled();
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true } },
    });
    await flushPromises();
    expect(wrapper.text()).not.toContain('legacy-claim');
    expect(service.updateClaims).not.toHaveBeenCalled();
  });

  it('retains import results when the filtered list refresh fails and retries only that read', async () => {
    const { wrapper, service, config, injector } = await render();
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.Import': true } },
    });
    await wrapper.get('input[type="search"]').setValue('import-scope');
    await vi.waitFor(() => expect(service.getList).toHaveBeenCalledTimes(2));
    await click(wrapper, 'Import');
    await flushPromises();
    const file = new File(['synthetic workbook'], 'users.xlsx');
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: { length: 1, item: () => file },
    });
    await input.trigger('change');
    const report = vi.spyOn(injector.get(HttpErrorReporterService), 'reportError');
    service.getList.mockRejectedValueOnce(
      new AbpHttpError({
        status: 503,
        statusText: 'Service Unavailable',
        method: 'GET',
        url: '/api/identity/users',
      }),
    );
    await click(wrapper, 'Upload');
    await flushPromises();
    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.text()).toContain('Total');
    expect(dialog.text()).toContain('ErrorLoadingDatatable');
    expect(dialog.findAll('dd').map(value => value.text())).toEqual(['2', '1', '1']);
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
    expect(report).not.toHaveBeenCalled();
    await click(wrapper, 'Refresh');
    await flushPromises();
    expect(service.importUsersFromFile).toHaveBeenCalledTimes(1);
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ filter: 'import-scope', notActive: false }),
      expect.anything(),
    );
    expect(dialog.text()).not.toContain('ErrorLoadingDatatable');
    expect(dialog.findAll('dd').map(value => value.text())).toEqual(['2', '1', '1']);
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true } },
    });
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('waits for the current search before exporting all matching users without pagination', async () => {
    const { wrapper, service, config, injector } = await render();
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.Export': true } },
    });
    const download = vi
      .spyOn(injector.get(WindowService), 'downloadBlob')
      .mockImplementation(() => {});
    let complete: (result: { items: IdentityUserDto[]; totalCount: number }) => void = () => {};
    service.getList.mockReturnValueOnce(
      new Promise(resolve => {
        complete = resolve;
      }),
    );
    await wrapper.get('input[type="search"]').setValue('next-search');
    await click(wrapper, 'Export');
    await flushPromises();
    expect(wrapper.get('[role="dialog"]').text()).toContain('LoadingWithThreeDot');
    expect(
      wrapper
        .findAll('button')
        .find(button => button.text().endsWith('ToCSV'))
        ?.attributes('disabled'),
    ).toBeDefined();
    expect(service.getDownloadToken).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(service.getList).toHaveBeenCalledTimes(2));
    complete({ items: [user], totalCount: 20 });
    await flushPromises();
    await click(wrapper, 'ToCSV');
    await flushPromises();
    expect(service.getListAsCsvFile).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'next-search',
        notActive: false,
        token: 'synthetic-capability',
      }),
      expect.anything(),
    );
    expect(service.getListAsCsvFile.mock.calls[0]?.[0]).not.toHaveProperty('skipCount');
    expect(service.getListAsCsvFile.mock.calls[0]?.[0]).not.toHaveProperty('maxResultCount');
    expect(download).toHaveBeenCalledExactlyOnceWith(expect.any(Blob), 'UserList.csv');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('keeps a reopened export dialog when an older cancelled download completes', async () => {
    const { wrapper, service, config, injector } = await render();
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.Export': true } },
    });
    const download = vi
      .spyOn(injector.get(WindowService), 'downloadBlob')
      .mockImplementation(() => {});
    let complete: (blob: Blob) => void = () => {};
    service.getListAsCsvFile.mockReturnValueOnce(
      new Promise(resolve => {
        complete = resolve;
      }),
    );
    await flushPromises();
    await click(wrapper, 'Export');
    await click(wrapper, 'ToCSV');
    await flushPromises();
    await click(wrapper, 'Cancel');
    await click(wrapper, 'Export');
    complete(new Blob(['synthetic'], { type: 'text/csv' }));
    await flushPromises();
    expect(download).not.toHaveBeenCalled();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    await click(wrapper, 'ToCSV');
    await flushPromises();
    expect(service.getDownloadToken).toHaveBeenCalledTimes(2);
    expect(download).toHaveBeenCalledOnce();
  });

  it('hides capability-bearing transport errors and explicitly retries with a fresh token', async () => {
    const { wrapper, service, config, injector } = await render();
    config.setState({
      ...config.snapshot(),
      auth: { grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.Export': true } },
    });
    vi.spyOn(injector.get(WindowService), 'downloadBlob').mockImplementation(() => {});
    service.getListAsCsvFile.mockRejectedValueOnce(
      new Error('The URL contained token=private-synthetic-capability'),
    );
    await flushPromises();
    await click(wrapper, 'Export');
    await click(wrapper, 'ToCSV');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    expect(wrapper.text()).not.toContain('private-synthetic-capability');
    await click(wrapper, 'Refresh');
    await flushPromises();
    expect(service.getDownloadToken).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('opens fresh readonly details after an administrative username search', async () => {
    const { wrapper, service, config } = await render();
    config.setState({
      ...config.snapshot(),
      auth: {
        grantedPolicies: { 'AbpIdentity.Users': true, 'AbpIdentity.Users.ViewDetails': true },
      },
    });
    const found = { ...user, id: '00112233-4455-6677-8899-aabbccddeeff', userName: 'located-user' };
    service.findByUsername.mockResolvedValueOnce(found);
    service.get.mockResolvedValueOnce({ ...found, name: 'Fresh located detail' });
    await flushPromises();
    await click(wrapper, 'Search');
    const dialog = wrapper.get('[role="dialog"]');
    await dialog.get('select[name="findBy"]').setValue('userName');
    await dialog.get('input[name="findValue"]').setValue('located-user');
    await dialog.get('form').trigger('submit');
    await flushPromises();
    expect(service.findByUsername).toHaveBeenCalledWith('located-user', expect.anything());
    expect(service.get).toHaveBeenCalledWith(found.id, expect.anything());
    expect(wrapper.get('[role="dialog"]').text()).toContain('Fresh located detail');
    expect(service.update).not.toHaveBeenCalled();
  });

  it('reads fresh details only with the separate view policy and closes them when it is revoked', async () => {
    const { wrapper, service, config } = await render();
    expect(wrapper.findAll('button').some(button => button.text().endsWith('ViewDetails'))).toBe(
      false,
    );
    const state = config.snapshot();
    const granted = {
      ...state,
      auth: {
        grantedPolicies: { ...state.auth.grantedPolicies, 'AbpIdentity.Users.ViewDetails': true },
      },
    };
    config.setState(granted);
    service.get.mockResolvedValueOnce({ ...user, userName: 'fresh-details' });
    await flushPromises();
    await click(wrapper, 'ViewDetails');
    await flushPromises();
    expect(wrapper.get('[role="dialog"]').text()).toContain('fresh-details');
    expect(service.get).toHaveBeenCalledExactlyOnceWith(
      'test-user',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(service.update).not.toHaveBeenCalled();
    config.setState(state);
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    config.setState(granted);
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('applies a filter draft explicitly and resets all applied filters on a context change', async () => {
    const { wrapper, service, config } = await render();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ notActive: false }),
      expect.anything(),
    );
    await click(wrapper, 'Filters');
    await flushPromises();
    await wrapper.get('input[name="name"]').setValue('exact-name');
    expect(service.getList).toHaveBeenCalledTimes(1);
    const form = wrapper.get('form[aria-label="AbpIdentity::Filters"]');
    await form.trigger('submit');
    await flushPromises();
    expect(service.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'exact-name', notActive: false, skipCount: 0 }),
      expect.anything(),
    );
    const beforeClear = service.getList.mock.calls.length;
    await click(wrapper, 'Clear');
    await flushPromises();
    expect(service.getList).toHaveBeenCalledTimes(beforeClear);
    const state = config.snapshot();
    config.setState({ ...state, currentTenant: { ...state.currentTenant, id: 'another-tenant' } });
    await flushPromises();
    const query = service.getList.mock.lastCall?.[0];
    expect(query).toMatchObject({ notActive: false, skipCount: 0 });
    expect(query).not.toHaveProperty('name');
    expect(
      wrapper
        .findAll('button')
        .find(button => button.text().endsWith('Filters'))
        ?.attributes('aria-expanded'),
    ).toBe('false');
    await click(wrapper, 'Filters');
    await flushPromises();
    expect(wrapper.get('input[name="name"]').element).toHaveProperty('value', '');
  });

  it('does not report a cancelled list request but reports a current transport failure once', async () => {
    const transport = vi.fn<FetchLike>();
    transport.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')));
        }),
    );
    transport.mockResolvedValueOnce(new Response(JSON.stringify({ items: [user], totalCount: 1 })));
    transport.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'The current list failed' } }), {
        status: 500,
      }),
    );
    const { wrapper, config, injector } = await render(api(), transport);
    const reported = vi.fn();
    injector.get(HttpErrorReporterService).onError(reported);
    const state = config.snapshot();
    config.setState({ ...state, currentTenant: { ...state.currentTenant, id: 'tenant-a' } });
    await flushPromises();
    expect(wrapper.text()).toContain('original@example.test');
    expect(reported).not.toHaveBeenCalled();
    config.setState({ ...state, currentTenant: { ...state.currentTenant, id: 'tenant-b' } });
    await flushPromises();
    expect(reported).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 500 }));
  });

  it('clears previous-context users and ignores their late list response', async () => {
    const service = api();
    let complete: (result: { items: IdentityUserDto[]; totalCount: number }) => void = () => {};
    service.getList.mockReturnValueOnce(
      new Promise(resolve => {
        complete = resolve;
      }),
    );
    service.getList.mockResolvedValueOnce({
      items: [
        {
          ...user,
          id: 'new-user',
          userName: 'new-context-user',
          email: 'new-context@example.test',
        },
      ],
      totalCount: 1,
    });
    const { wrapper, config } = await render(service);
    const state = config.snapshot();
    config.setState({ ...state, currentTenant: { ...state.currentTenant, id: 'new-tenant' } });
    await flushPromises();
    expect(wrapper.text()).toContain('new-context-user');
    complete({ items: [user], totalCount: 1 });
    await flushPromises();
    expect(wrapper.text()).toContain('new-context-user');
    expect(wrapper.text()).not.toContain('original@example.test');
  });

  it('focuses the first invalid field without sending an update', async () => {
    const { wrapper, service } = await render();
    await click(wrapper, 'Edit');
    await flushPromises();
    const userName = wrapper.get('[role="dialog"]').get<HTMLInputElement>('input[name="userName"]');
    await userName.setValue('');
    await click(wrapper, 'Save');
    await flushPromises();
    expect(userName.attributes('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(userName.element);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('keeps saving unavailable after a relation read fails and offers a complete retry', async () => {
    const service = api();
    service.getRoles.mockRejectedValueOnce(new Error('Roles are unavailable'));
    const { wrapper } = await render(service);
    await click(wrapper, 'Edit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('ErrorLoadingDatatable');
    const save = wrapper.findAll('button').find(button => button.text().endsWith('Save'));
    expect(save?.attributes('disabled')).toBeDefined();
    expect(wrapper.get('[role="dialog"]').find('input[name="name"]').exists()).toBe(false);
    await click(wrapper, 'Refresh');
    await flushPromises();
    expect(
      wrapper.get('[role="dialog"]').get<HTMLInputElement>('input[name="name"]').element.value,
    ).toBe('Before');
    expect(service.getRoles).toHaveBeenCalledTimes(2);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('preserves untouched commercial values and extensions while editing only a name', async () => {
    const { wrapper, service } = await render();
    await click(wrapper, 'Edit');
    await flushPromises();
    expect(wrapper.get('[role="dialog"]').find('input[name="password"]').exists()).toBe(false);
    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['UserInformations']);
    await wrapper.get('[role="dialog"]').get('input[name="name"]').setValue('After');
    await click(wrapper, 'Save');
    await flushPromises();
    expect(service.update).toHaveBeenCalledExactlyOnceWith(
      'test-user',
      expect.objectContaining({
        name: 'After',
        emailConfirmed: true,
        phoneNumberConfirmed: true,
        shouldChangePasswordOnNextLogin: true,
        concurrencyStamp: 'fresh-stamp',
        extraProperties: { HiddenValue: 'preserve' },
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    const body = service.update.mock.calls[0]?.[1];
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('roleNames');
    expect(body).not.toHaveProperty('organizationUnitIds');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('clears phone confirmation as the phone becomes blank and retains a rejected edit', async () => {
    const service = api();
    service.update.mockRejectedValueOnce(new Error('The server rejected the edit'));
    const { wrapper } = await render(service);
    await click(wrapper, 'Edit');
    await flushPromises();
    await wrapper.get('[role="dialog"]').get('input[name="phoneNumber"]').setValue('');
    const confirmed = wrapper
      .get('[role="dialog"]')
      .get<HTMLInputElement>('input[name="phoneNumberConfirmed"]');
    expect(confirmed.element.checked).toBe(false);
    expect(confirmed.element.disabled).toBe(true);
    await click(wrapper, 'Save');
    await flushPromises();
    expect(service.update).toHaveBeenCalledWith(
      'test-user',
      expect.objectContaining({ phoneNumber: '', phoneNumberConfirmed: false }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(
      wrapper.get('[role="dialog"]').get<HTMLInputElement>('input[name="phoneNumber"]').element
        .value,
    ).toBe('');
  });

  it('does not reopen a closed editor when an obsolete detail request completes', async () => {
    const service = api();
    let complete: (record: IdentityUserDto) => void = () => {};
    service.get.mockReturnValueOnce(
      new Promise(resolve => {
        complete = resolve;
      }),
    );
    const { wrapper } = await render(service);
    await click(wrapper, 'Edit');
    await flushPromises();
    await click(wrapper, 'Cancel');
    complete(user);
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(service.update).not.toHaveBeenCalled();
  });
});
