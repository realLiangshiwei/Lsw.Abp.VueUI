import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
  type Injector,
  type PagedResultDto,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { FeaturesService } from '@lsw-abpvue/feature-management/proxy';
import { TenantService, type TenantDto } from '@lsw-abpvue/tenant-management/proxy';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { expectAccessiblePage, plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tenantManagementExtensionsResolver } from '../resolvers/extensions.resolver.js';
import AbpTenantConnectionString from './AbpTenantConnectionString.vue';
import TenantsPage from './TenantsPage.vue';

const ALL_POLICIES = [
  'AbpTenantManagement.Tenants',
  'AbpTenantManagement.Tenants.Create',
  'AbpTenantManagement.Tenants.Update',
  'AbpTenantManagement.Tenants.Delete',
  'AbpTenantManagement.Tenants.ManageFeatures',
  'AbpTenantManagement.Tenants.ManageConnectionStrings',
];

const TENANTS: TenantDto[] = [
  { id: 'tenant-1', name: 'acme', concurrencyStamp: 'stamp-1' },
  { id: 'tenant-2', name: 'globex', concurrencyStamp: 'stamp-2' },
];

const paged = <T>(items: T[]): Promise<PagedResultDto<T>> =>
  Promise.resolve({ items, totalCount: items.length });

interface Spies {
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
  getConnectionString?: ReturnType<typeof vi.fn>;
  updateConnectionString?: ReturnType<typeof vi.fn>;
  deleteConnectionString?: ReturnType<typeof vi.fn>;
}

function tenantService(spies: Spies = {}): ProviderInput {
  return {
    provide: TenantService,
    useValue: {
      getList: () => paged(TENANTS),
      get: (id: string) => Promise.resolve(TENANTS.find(tenant => tenant.id === id) as TenantDto),
      create: spies.create ?? (() => Promise.resolve(TENANTS[0] as TenantDto)),
      update: spies.update ?? (() => Promise.resolve(TENANTS[0] as TenantDto)),
      delete: spies.remove ?? (() => Promise.resolve()),
      getDefaultConnectionString: spies.getConnectionString ?? (() => Promise.resolve('')),
      updateDefaultConnectionString: spies.updateConnectionString ?? (() => Promise.resolve()),
      deleteDefaultConnectionString: spies.deleteConnectionString ?? (() => Promise.resolve()),
    } as unknown as TenantService,
  };
}

const featuresService: ProviderInput = {
  provide: FeaturesService,
  useValue: {
    get: () => Promise.resolve({ groups: [] }),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  } as unknown as FeaturesService,
};

const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

function injectorWith(providers: ProviderInput[], policies = ALL_POLICIES): Injector {
  const injector = createInjector([...plainTheme.providers, ...providers]);
  const configState = injector.get(ConfigStateService);

  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: Object.fromEntries(policies.map(name => [name, true])) },
  } as ApplicationConfigurationDto);

  injector.runInContext(() => tenantManagementExtensionsResolver());

  return injector;
}

async function settle(wrapper: VueWrapper): Promise<void> {
  await new Promise(resolve => setTimeout(resolve));
  await wrapper.vm.$nextTick();
}

async function renderPage(injector: Injector): Promise<VueWrapper> {
  const wrapper: VueWrapper = mount(TenantsPage, {
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string | { defaultValue: string }) =>
          typeof key === 'string' ? key : key.defaultValue,
      },
      stubs: { RouterLink: true },
    },
  });

  mounted.push(wrapper);
  await settle(wrapper);

  return wrapper;
}

function buttonsSaying(text: string): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].filter(button =>
    button.textContent?.includes(text),
  );
}

/** The nth row's copy of a row action, the way someone using the page reaches it. */
const rowAction = (text: string, index = 0): HTMLButtonElement | undefined =>
  buttonsSaying(text)[index];

describe('TenantsPage', () => {
  it('lists what the backend answered', async () => {
    const page = await renderPage(injectorWith([tenantService(), featuresService]));

    expect(page.text()).toContain('acme');
    expect(page.text()).toContain('globex');
  });

  it('asks a new tenant for an administrator', async () => {
    const page = await renderPage(injectorWith([tenantService(), featuresService]));

    rowAction('AbpTenantManagement::NewTenant')?.click();
    await settle(page);

    expect(document.body.textContent).toContain(
      'AbpTenantManagement::DisplayName:AdminEmailAddress',
    );
  });

  it('does not ask an existing tenant for one, and sends its concurrency stamp back', async () => {
    const update = vi.fn(() => Promise.resolve(TENANTS[0] as TenantDto));
    const page = await renderPage(injectorWith([tenantService({ update }), featuresService]));

    rowAction('AbpUi::Edit')?.click();
    await settle(page);

    expect(document.body.textContent).not.toContain(
      'AbpTenantManagement::DisplayName:AdminEmailAddress',
    );

    rowAction('AbpUi::Save')?.click();
    await settle(page);

    expect(update).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ name: 'acme', concurrencyStamp: 'stamp-1' }),
    );
  });

  it('names the tenant in the delete confirmation', async () => {
    const remove = vi.fn(() => Promise.resolve());
    const warn = vi.fn(() => Promise.resolve(ConfirmationStatus.confirm));
    const page = await renderPage(
      injectorWith([
        tenantService({ remove }),
        featuresService,
        { provide: ConfirmationService, useValue: { warn } as unknown as ConfirmationService },
      ]),
    );

    // The second row's delete button: two rows, one such button each.
    rowAction('AbpUi::Delete', 1)?.click();
    await settle(page);

    expect(warn).toHaveBeenCalledWith(
      'AbpTenantManagement::TenantDeletionConfirmationMessage',
      'AbpUi::AreYouSure',
      { messageLocalizationParams: ['globex'] },
    );
    expect(remove).toHaveBeenCalledWith('tenant-2');
  });

  it('is accessible with a page of records on it', async () => {
    const wrapper = await renderPage(injectorWith([tenantService()]));

    await expectAccessiblePage(wrapper.element);
  });

  it('leaves out a row action whose permission is not granted', async () => {
    const page = await renderPage(
      injectorWith([tenantService(), featuresService], ['AbpTenantManagement.Tenants']),
    );

    expect(page.text()).not.toContain('AbpTenantManagement::ConnectionStrings');
    expect(page.text()).not.toContain('AbpTenantManagement::NewTenant');
  });
});

describe('AbpTenantConnectionString', () => {
  async function renderDialog(injector: Injector): Promise<VueWrapper> {
    const wrapper: VueWrapper = mount(AbpTenantConnectionString, {
      attachTo: document.body,
      props: { visible: true, tenantId: 'tenant-1', tenantName: 'acme' },
      global: {
        provide: { [ABP_INJECTOR_KEY]: injector },
        mocks: {
          $t: (key: string | { defaultValue: string }) =>
            typeof key === 'string' ? key : key.defaultValue,
        },
      },
    });

    mounted.push(wrapper);
    await settle(wrapper);

    return wrapper;
  }

  it('reads no connection string as the shared database', async () => {
    const wrapper = await renderDialog(injectorWith([tenantService(), featuresService]));

    expect(
      (document.body.querySelector('input[type="checkbox"]') as HTMLInputElement).checked,
    ).toBe(true);
    expect(wrapper.text()).not.toContain(
      'AbpTenantManagement::DisplayName:DefaultConnectionString',
    );
  });

  it('shows the box once the tenant has a database of its own', async () => {
    const wrapper = await renderDialog(
      injectorWith([
        tenantService({ getConnectionString: vi.fn(() => Promise.resolve('Server=one;')) }),
        featuresService,
      ]),
    );

    const box = document.body.querySelector('input[autocomplete="off"]') as HTMLInputElement | null;
    expect(box?.value).toBe('Server=one;');
    expect(wrapper.find('input[type="checkbox"]').element).toHaveProperty('checked', false);
  });

  it('deletes rather than saves an empty one when the shared database is chosen', async () => {
    const deleteConnectionString = vi.fn(() => Promise.resolve());
    const updateConnectionString = vi.fn(() => Promise.resolve());
    const wrapper = await renderDialog(
      injectorWith([
        tenantService({
          getConnectionString: vi.fn(() => Promise.resolve('Server=one;')),
          deleteConnectionString,
          updateConnectionString,
        }),
        featuresService,
      ]),
    );

    (document.body.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    await settle(wrapper);

    rowAction('AbpUi::Save')?.click();
    await settle(wrapper);

    expect(deleteConnectionString).toHaveBeenCalledWith('tenant-1');
    expect(updateConnectionString).not.toHaveBeenCalled();
  });
});
