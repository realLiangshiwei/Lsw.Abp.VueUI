import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import {
  PermissionsService,
  type GetPermissionListResultDto,
  type UpdatePermissionsDto,
} from '@lsw-abpvue/permission-management/proxy';
import { ToasterService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import AbpPermissionManagement from './AbpPermissionManagement.vue';

const ANSWER: GetPermissionListResultDto = {
  entityDisplayName: 'admin',
  groups: [
    {
      name: 'AbpIdentity',
      displayName: 'Identity management',
      permissions: [
        {
          name: 'AbpIdentity.Roles',
          displayName: 'Role management',
          isGranted: false,
          isEditable: true,
        },
        {
          name: 'AbpIdentity.Roles.Create',
          parentName: 'AbpIdentity.Roles',
          displayName: 'Create',
          isGranted: false,
          isEditable: true,
        },
      ],
    },
    {
      name: 'AbpTenantManagement',
      displayName: 'Tenant management',
      permissions: [
        {
          name: 'AbpTenantManagement.Tenants',
          displayName: 'Tenants',
          isGranted: true,
          isEditable: true,
          grantedProviders: [{ providerName: 'R', providerKey: 'admin' }],
        },
      ],
    },
  ],
};

type Update = (name: string, key: string, input: UpdatePermissionsDto) => Promise<void>;

function permissionsService(update: Update = () => Promise.resolve()): ProviderInput {
  return {
    provide: PermissionsService,
    useValue: {
      get: () => Promise.resolve(structuredClone(ANSWER)),
      update,
    } as unknown as PermissionsService,
  };
}

/** The dialog is mounted into the document, so what it drew is read off the document. */
function checkboxes(): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>('.abp-permissions input[type=checkbox]')];
}

function tabs(): string[] {
  return [...document.querySelectorAll<HTMLButtonElement>('[role=tab]')].map(tab =>
    (tab.textContent ?? '').replace(/\s+/g, ' ').trim(),
  );
}

function clickTab(index: number): void {
  document.querySelectorAll<HTMLButtonElement>('[role=tab]')[index]?.click();
}

function clickSave(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    'footer button, .modal button',
  )) {
    if (button.textContent?.includes('AbpUi::Save')) button.click();
  }
}

const mounted: VueWrapper[] = [];

// Every test attaches to the document, and a wrapper left behind would answer the next
// test's queries before the dialog it is actually about.
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

async function open(providers: ProviderInput[] = []): Promise<{
  wrapper: VueWrapper;
  injector: Injector;
}> {
  const injector = createInjector([...plainTheme.providers, permissionsService(), ...providers]);

  const wrapper = mount(AbpPermissionManagement, {
    props: { visible: true, providerName: 'U', providerKey: 'user-1' } as never,
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => key },
    },
  });

  mounted.push(wrapper);
  await new Promise(resolve => setTimeout(resolve));
  await wrapper.vm.$nextTick();

  return { wrapper, injector };
}

describe('AbpPermissionManagement', () => {
  it('lists the groups as tabs and the first group as checkboxes', async () => {
    await open();

    expect(tabs()).toEqual(['Identity management', 'Tenant management (1)']);
    expect(document.body.textContent).toContain('Role management');
    expect(document.body.textContent).not.toContain('Tenants');
  });

  it('shows the permissions of the tab that is picked', async () => {
    const { wrapper } = await open();

    clickTab(1);
    await wrapper.vm.$nextTick();

    expect(document.body.textContent).toContain('Tenants');
  });

  it('refuses to change a permission another provider grants', async () => {
    const { wrapper } = await open();

    clickTab(1);
    await wrapper.vm.$nextTick();

    // Two select-all boxes come first; the last one is the permission itself.
    expect(checkboxes().at(-1)?.disabled).toBe(true);
  });

  it('grants the parent when a child is granted', async () => {
    const { wrapper } = await open();

    // [0] select all in all tabs, [1] select all in this tab, [2] Roles, [3] Roles.Create
    checkboxes()[3]?.click();
    await wrapper.vm.$nextTick();

    expect(checkboxes()[2]?.checked).toBe(true);
    expect(checkboxes()[3]?.checked).toBe(true);
  });

  it('revokes the children when the parent is revoked', async () => {
    const { wrapper } = await open();

    checkboxes()[3]?.click();
    await wrapper.vm.$nextTick();
    checkboxes()[2]?.click();
    await wrapper.vm.$nextTick();

    expect(checkboxes()[2]?.checked).toBe(false);
    expect(checkboxes()[3]?.checked).toBe(false);
  });

  it('counts what a group has granted next to its tab', async () => {
    const { wrapper } = await open();

    expect(tabs()[0]).toBe('Identity management');

    checkboxes()[3]?.click();
    await wrapper.vm.$nextTick();

    expect(tabs()[0]).toBe('Identity management (2)');
  });

  it('sends only what changed', async () => {
    const update = vi.fn<Update>(() => Promise.resolve());
    const { wrapper } = await open([permissionsService(update)]);

    checkboxes()[3]?.click();
    await wrapper.vm.$nextTick();

    clickSave();
    await new Promise(resolve => setTimeout(resolve));

    expect(update).toHaveBeenCalledWith('U', 'user-1', {
      permissions: [
        { name: 'AbpIdentity.Roles', isGranted: true },
        { name: 'AbpIdentity.Roles.Create', isGranted: true },
      ],
    });
  });

  it('closes without a request when nothing was changed', async () => {
    const update = vi.fn<Update>(() => Promise.resolve());
    const { wrapper } = await open([permissionsService(update)]);

    clickSave();
    await new Promise(resolve => setTimeout(resolve));

    expect(update).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:visible')?.at(-1)).toEqual([false]);
  });

  it('reloads the application configuration when the change is about the current user', async () => {
    const injector = createInjector([]);
    const real = injector.get(ConfigStateService);
    const refresh = vi.fn(() => Promise.resolve(real.snapshot()));
    const configState = {
      ...real,
      // Only the current user is stubbed: the localizer reads the same service.
      getOne: (key: string) =>
        key === 'currentUser'
          ? computed(() => ({ id: 'user-1', roles: [] }))
          : real.getOne(key as never),
      refreshAppState: refresh,
    } as unknown as ConfigStateService;

    const { wrapper } = await open([{ provide: ConfigStateService, useValue: configState }]);

    checkboxes()[3]?.click();
    await wrapper.vm.$nextTick();
    clickSave();
    await new Promise(resolve => setTimeout(resolve));

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('says the save went through', async () => {
    const { wrapper, injector } = await open();

    checkboxes()[3]?.click();
    await wrapper.vm.$nextTick();
    clickSave();
    await new Promise(resolve => setTimeout(resolve));

    expect(injector.get(ToasterService).toasts.value).toHaveLength(1);
  });
});

describe('the filter', () => {
  it('keeps the groups that match and moves off a tab it hid', async () => {
    const { wrapper } = await open();

    const search = document.querySelector<HTMLInputElement>('input[type=search]');
    if (search) {
      search.value = 'tenant';
      search.dispatchEvent(new Event('input'));
    }
    await wrapper.vm.$nextTick();

    expect(tabs()).toEqual(['Tenant management (1)']);
    expect(document.body.textContent).toContain('Tenants');
  });
});
