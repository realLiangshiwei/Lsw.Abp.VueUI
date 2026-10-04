import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  StorageService,
  type ApplicationConfigurationDto,
  type Injector,
  type ListResultDto,
  type PagedResultDto,
  type ProviderInput,
} from '@lsw-abpvue/core';
import {
  IdentityRoleService,
  IdentityUserService,
  type IdentityRoleDto,
  type IdentityUserDto,
} from '@lsw-abpvue/identity/proxy';
import { PermissionsService } from '@lsw-abpvue/permission-management/proxy';
import { ConfirmationService } from '@lsw-abpvue/theme-shared';
import { expectAccessiblePage, plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { IdentityComponents } from '../enums/components.js';
import { identityExtensionsResolver } from '../resolvers/extensions.resolver.js';
import RolesPage from './RolesPage.vue';
import UsersPage from './UsersPage.vue';

const ALL_POLICIES = [
  'AbpIdentity.Roles',
  'AbpIdentity.Roles.Create',
  'AbpIdentity.Roles.Update',
  'AbpIdentity.Roles.Delete',
  'AbpIdentity.Roles.ManagePermissions',
  'AbpIdentity.Users',
  'AbpIdentity.Users.Create',
  'AbpIdentity.Users.Update',
  'AbpIdentity.Users.Delete',
  'AbpIdentity.Users.ManagePermissions',
];

const USERS: IdentityUserDto[] = [
  {
    id: 'user-1',
    userName: 'admin',
    email: 'admin@abp.io',
    phoneNumber: '',
    isActive: true,
    emailConfirmed: true,
    phoneNumberConfirmed: false,
    lockoutEnabled: true,
    accessFailedCount: 0,
    entityVersion: 0,
  },
  {
    id: 'user-2',
    userName: 'john.nash',
    email: 'john@abp.io',
    phoneNumber: '',
    isActive: false,
    emailConfirmed: false,
    phoneNumberConfirmed: false,
    lockoutEnabled: true,
    accessFailedCount: 0,
    entityVersion: 0,
  },
];

const ROLES: IdentityRoleDto[] = [
  {
    id: 'role-1',
    name: 'admin',
    isDefault: false,
    isStatic: true,
    isPublic: false,
    creationTime: '',
  },
  {
    id: 'role-2',
    name: 'reader',
    isDefault: true,
    isStatic: false,
    isPublic: true,
    creationTime: '',
  },
];

const paged = <T>(items: T[]): Promise<PagedResultDto<T>> =>
  Promise.resolve({ items, totalCount: items.length });
const listed = <T>(items: T[]): Promise<ListResultDto<T>> => Promise.resolve({ items });

interface UserSpies {
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

function userService(spies: Partial<UserSpies> = {}): ProviderInput {
  return {
    provide: IdentityUserService,
    useValue: {
      getList: () => paged(USERS),
      get: (id: string) => Promise.resolve(USERS.find(user => user.id === id) as IdentityUserDto),
      getAssignableRoles: () => listed(ROLES),
      getRoles: () => listed([ROLES[1] as IdentityRoleDto]),
      create: spies.create ?? (() => Promise.resolve(USERS[0] as IdentityUserDto)),
      update: spies.update ?? (() => Promise.resolve(USERS[0] as IdentityUserDto)),
      delete: spies.remove ?? (() => Promise.resolve()),
    } as unknown as IdentityUserService,
  };
}

function roleService(spies: Partial<UserSpies> = {}): ProviderInput {
  return {
    provide: IdentityRoleService,
    useValue: {
      getList: () => paged(ROLES),
      getAllList: () => listed(ROLES),
      get: (id: string) => Promise.resolve(ROLES.find(role => role.id === id) as IdentityRoleDto),
      create: spies.create ?? (() => Promise.resolve(ROLES[0] as IdentityRoleDto)),
      update: spies.update ?? (() => Promise.resolve(ROLES[0] as IdentityRoleDto)),
      delete: spies.remove ?? (() => Promise.resolve()),
    } as unknown as IdentityRoleService,
  };
}

const permissionsService: ProviderInput = {
  provide: PermissionsService,
  useValue: {
    get: () => Promise.resolve({ entityDisplayName: '', groups: [] }),
    update: () => Promise.resolve(),
  } as unknown as PermissionsService,
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
    currentUser: {
      id: 'user-1',
      userName: 'admin',
      isAuthenticated: true,
      emailVerified: true,
      phoneNumberVerified: false,
      roles: ['admin'],
    },
  } as ApplicationConfigurationDto);

  injector.runInContext(() => identityExtensionsResolver());

  return injector;
}

async function render(page: Component, injector: Injector): Promise<VueWrapper> {
  const wrapper: VueWrapper = mount(page as never, {
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        // Some keys arrive as `{ key, defaultValue }`; the real localizer takes both.
        $t: (key: string | { defaultValue: string }) =>
          typeof key === 'string' ? key : key.defaultValue,
      },
      stubs: { RouterLink: true },
    },
  });

  mounted.push(wrapper);
  await new Promise(resolve => setTimeout(resolve));
  await wrapper.vm.$nextTick();

  return wrapper;
}

function buttonsSaying(text: string): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].filter(button =>
    button.textContent?.includes(text),
  );
}

describe('list preferences', () => {
  it.each([
    { page: UsersPage, key: IdentityComponents.Users, service: userService() },
    { page: RolesPage, key: IdentityComponents.Roles, service: roleService() },
  ])(
    'restores and saves preferences under the component key: $key',
    async ({ page, key, service }) => {
      const storedKey = `abpvue.list.${key}.user-1`;
      const values = new Map([[storedKey, JSON.stringify({ maxResultCount: 25 })]]);
      const storage: StorageService = {
        getItem: name => values.get(name) ?? null,
        setItem: (name, value) => void values.set(name, value),
        removeItem: name => void values.delete(name),
        keys: () => [...values.keys()],
        onChange: () => () => {},
      };
      const wrapper = await render(
        page,
        injectorWith([service, permissionsService, { provide: StorageService, useValue: storage }]),
      );
      const selector = wrapper.get<HTMLSelectElement>('select[aria-label="Page size"]');
      expect(selector.element.value).toBe('25');
      await selector.setValue('50');
      expect(JSON.parse(values.get(storedKey) ?? '{}')).toMatchObject({ maxResultCount: 50 });
      expect([...values.keys()]).toEqual([storedKey]);
    },
  );
});

describe('UsersPage', () => {
  it('lists what the backend answered with, in the columns the module declares', async () => {
    const wrapper = await render(UsersPage, injectorWith([userService(), permissionsService]));

    expect(wrapper.text()).toContain('admin');
    expect(wrapper.text()).toContain('john.nash');
    // No localization is loaded, so a key resolves to its own last segment.
    expect(wrapper.findAll('th').map(th => th.text())).toEqual([
      'Actions',
      'UserName',
      'EmailAddress',
      'PhoneNumber',
    ]);
  });

  it('marks an account that is not active', async () => {
    const wrapper = await render(UsersPage, injectorWith([userService(), permissionsService]));

    expect(wrapper.find('.bi-slash-circle').exists()).toBe(true);
  });

  it('opens a create form with the roles the tenant hands out by default', async () => {
    const wrapper = await render(UsersPage, injectorWith([userService(), permissionsService]));

    buttonsSaying('AbpIdentity::NewUser')[0]?.click();
    await new Promise(resolve => setTimeout(resolve));
    await wrapper.vm.$nextTick();

    // The dialog's tabs are `AbpTabList`, which localizes its own labels.
    document.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1]?.click();
    await wrapper.vm.$nextTick();

    const checked = [...document.querySelectorAll<HTMLInputElement>('.abp-identity-roles input')];
    expect(checked.map(input => input.checked)).toEqual([false, true]);
  });

  it('sends the roles that were ticked', async () => {
    const create = vi.fn<(input: unknown) => Promise<IdentityUserDto>>(() =>
      Promise.resolve(USERS[0] as IdentityUserDto),
    );
    const injector = injectorWith([userService({ create }), permissionsService]);
    const wrapper = await render(UsersPage, injector);

    buttonsSaying('AbpIdentity::NewUser')[0]?.click();
    await new Promise(resolve => setTimeout(resolve));
    await wrapper.vm.$nextTick();

    for (const [name, value] of [
      ['userName', 'jane'],
      ['password', '1q2w3E*'],
      ['email', 'jane@abp.io'],
    ]) {
      const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (input) {
        input.value = value as string;
        input.dispatchEvent(new Event('input'));
      }
    }
    await wrapper.vm.$nextTick();

    buttonsSaying('AbpUi::Save')[0]?.click();
    await new Promise(resolve => setTimeout(resolve));

    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      userName: 'jane',
      email: 'jane@abp.io',
      roleNames: ['reader'],
    });
  });

  it('hides the delete button on the account you are signed in as', async () => {
    const wrapper = await render(UsersPage, injectorWith([userService(), permissionsService]));

    const rows = wrapper.findAll('tbody tr');
    expect(rows[0]?.text()).not.toContain('AbpUi::Delete');
    expect(rows[1]?.text()).toContain('AbpUi::Delete');
  });

  it('is accessible with a page of records on it', async () => {
    const wrapper = await render(UsersPage, injectorWith([userService(), permissionsService]));

    await expectAccessiblePage(wrapper.element);
  });

  it('leaves out a row action whose permission is not granted', async () => {
    const injector = injectorWith([userService(), permissionsService], ['AbpIdentity.Users']);
    const wrapper = await render(UsersPage, injector);

    expect(wrapper.text()).not.toContain('AbpUi::Edit');
    expect(wrapper.text()).not.toContain('AbpIdentity::NewUser');
  });
});

describe('RolesPage', () => {
  it('badges the default and public roles', async () => {
    const wrapper = await render(RolesPage, injectorWith([roleService(), permissionsService]));

    expect(wrapper.text()).toContain('AbpIdentity::DisplayName:IsDefault');
    expect(wrapper.text()).toContain('AbpIdentity::DisplayName:IsPublic');
  });

  it('cannot delete a role the application declared in code', async () => {
    const wrapper = await render(RolesPage, injectorWith([roleService(), permissionsService]));

    const rows = wrapper.findAll('tbody tr');
    expect(rows[0]?.text()).not.toContain('AbpUi::Delete');
    expect(rows[1]?.text()).toContain('AbpUi::Delete');
  });

  it('creates a role', async () => {
    const create = vi.fn<(input: unknown) => Promise<IdentityRoleDto>>(() =>
      Promise.resolve(ROLES[0] as IdentityRoleDto),
    );
    const wrapper = await render(
      RolesPage,
      injectorWith([roleService({ create }), permissionsService]),
    );

    buttonsSaying('AbpIdentity::NewRole')[0]?.click();
    await wrapper.vm.$nextTick();

    const input = document.querySelector<HTMLInputElement>('input[name="name"]');
    if (input) {
      input.value = 'editor';
      input.dispatchEvent(new Event('input'));
    }
    await wrapper.vm.$nextTick();

    buttonsSaying('AbpUi::Save')[0]?.click();
    await new Promise(resolve => setTimeout(resolve));

    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0]?.[0]).toMatchObject({ name: 'editor', isDefault: false });
  });

  it('is accessible, dialog open', async () => {
    const wrapper = await render(RolesPage, injectorWith([roleService(), permissionsService]));

    await expectAccessiblePage(wrapper.element);

    buttonsSaying('AbpIdentity::NewRole')[0]?.click();
    await wrapper.vm.$nextTick();

    await expectAccessiblePage(document.body);
  });

  it('asks before deleting, and does nothing until the answer comes back', async () => {
    const remove = vi.fn(() => Promise.resolve());

    const injector = injectorWith([roleService({ remove }), permissionsService]);
    await render(RolesPage, injector);

    const deleteButtons = buttonsSaying('AbpUi::Delete');
    deleteButtons[deleteButtons.length - 1]?.click();
    await new Promise(resolve => setTimeout(resolve));

    const asked = injector.get(ConfirmationService).current.value;
    expect(asked?.message).toBe('AbpIdentity::RoleDeletionConfirmationMessage');
    expect(asked?.options.messageLocalizationParams).toEqual(['reader']);
    expect(remove).not.toHaveBeenCalled();
  });
});
