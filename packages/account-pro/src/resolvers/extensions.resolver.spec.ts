import {
  APP_INITIALIZERS,
  AuthService,
  ConfigStateService,
  createInjector,
  runInInjectionContext,
  type Injector,
} from '@lsw-abpvue/core';
import { EntityProp, ExtensionsService, FormProp, PropType } from '@lsw-abpvue/components';
import { ManageProfileTabsService } from '@lsw-abpvue/account-core';
import { AccountProProfileTabs, provideAccountProConfig } from '@lsw-abpvue/account-pro/config';
import { computed, defineComponent } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { provideAccountPro } from '../providers/account-pro.provider.js';
import { provideManageProfileTabs } from '@lsw-abpvue/account';
import { createAccountProRoutes } from '../routes.js';
import { accountProExtensionsResolver } from './extensions.resolver.js';

const injectors: Injector[] = [];
afterEach(() =>
  injectors
    .splice(0)
    .reverse()
    .forEach(injector => injector.destroy()),
);
it('inherits root form contributors through routes and keeps the Angular option spelling', () => {
  const contributor = vi.fn((list: { addTail(prop: FormProp): unknown }) => {
    list.addTail(new FormProp({ name: 'alias', type: PropType.String, isExtra: true }));
  });
  const root = createInjector([
    provideAccountPro({
      personelInfoEntityPropContributors: { 'Account.PersonalSettingsComponent': [contributor] },
    }),
  ]);
  injectors.push(root);
  const route = createAccountProRoutes().find(route => route.path === '/account/manage');
  const child = createInjector(route?.meta?.providers ?? [], root);
  injectors.push(child);
  const fields = () =>
    root
      .get(ExtensionsService)
      .editFormProps.get('Account.PersonalSettingsComponent')
      .props.toArray()
      .filter(prop => prop.name === 'alias');
  runInInjectionContext(child, accountProExtensionsResolver);
  expect(fields()).toHaveLength(1);
  runInInjectionContext(child, accountProExtensionsResolver);
  expect(fields()).toHaveLength(1);
});

it('adds security-log object extensions before application contributors without duplication', () => {
  const root = createInjector([
    provideAccountPro({
      entityPropContributors: {
        'Account.MySecurityLogs': [
          list => {
            const prop = list.find(value => value.name === 'Correlation');
            if (prop) {
              list.addAfter(
                new EntityProp({ ...prop.value, displayName: 'Custom correlation' }),
                prop.value,
              );
              list.dropByValue(prop.value);
            }
          },
        ],
      },
    }),
  ]);
  injectors.push(root);
  const config = root.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    objectExtensions: {
      modules: {
        Account: {
          configuration: {},
          entities: {
            SecurityLogs: {
              configuration: {},
              properties: {
                Correlation: {
                  type: 'System.String',
                  displayName: { name: 'Correlation', resource: 'AbpAccount' },
                  api: {
                    onGet: { isAvailable: true },
                    onCreate: { isAvailable: false },
                    onUpdate: { isAvailable: false },
                  },
                  attributes: [],
                  configuration: {},
                  defaultValue: null,
                  ui: {
                    onTable: { isVisible: true },
                    onCreateForm: { isVisible: false },
                    onEditForm: { isVisible: false },
                  },
                },
              },
            },
          },
        },
      },
      enums: {},
    },
  });
  runInInjectionContext(root, accountProExtensionsResolver);
  runInInjectionContext(root, accountProExtensionsResolver);
  const columns = root
    .get(ExtensionsService)
    .entityProps.get('Account.MySecurityLogs')
    .props.toArray();
  expect(columns.filter(prop => prop.name === 'Correlation')).toEqual([
    expect.objectContaining({ isExtra: true, displayName: 'Custom correlation' }),
  ]);
});

it('lets startup code customize and remove profile tabs before the lazy routes run', () => {
  const root = createInjector([
    provideAccountProConfig(),
    provideManageProfileTabs(),
    { provide: AuthService, useValue: { isAuthenticated: computed(() => false) } },
  ]);
  injectors.push(root);
  for (const initialize of root.get(APP_INITIALIZERS, [], { optional: true }))
    root.runInContext(initialize);
  const tabs = root.get(ManageProfileTabsService);
  const custom = defineComponent({ template: '<p>Custom profile</p>' });
  expect(tabs.patch(AccountProProfileTabs.PersonalInfo, { component: custom, order: 9 })).toBe(
    true,
  );
  tabs.remove([AccountProProfileTabs.ProfilePicture]);
  const route = createAccountProRoutes().find(route => route.path === '/account/manage');
  const child = createInjector(route?.meta?.providers ?? [], root);
  injectors.push(child);
  runInInjectionContext(child, accountProExtensionsResolver);
  expect(tabs.search({ name: AccountProProfileTabs.PersonalInfo })).toMatchObject({
    component: custom,
    order: 9,
  });
  expect(tabs.search({ name: AccountProProfileTabs.ProfilePicture })).toBeNull();
  expect(tabs.flat.value).toHaveLength(4);
});
