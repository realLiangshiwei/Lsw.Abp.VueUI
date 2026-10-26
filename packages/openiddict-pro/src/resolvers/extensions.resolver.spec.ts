import { SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import { EntityProp, ExtensionsService, FormProp, PropType } from '@lsw-abpvue/components';
import {
  APP_INITIALIZERS,
  ConfigStateService,
  createInjector,
  RoutesService,
} from '@lsw-abpvue/core';
import {
  OpenIddictProPolicyNames as Policy,
  provideOpenIddictProConfig,
} from '@lsw-abpvue/openiddict-pro/config';
import type { ApplicationDto, ScopeDto } from '@lsw-abpvue/openiddict-pro/proxy';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_APPLICATIONS_ENTITY_ACTIONS,
  DEFAULT_APPLICATIONS_CREATE_FORM_PROPS,
} from '../defaults/extensions.js';
import { OpenIddictProComponents as Keys } from '../enums/components.js';
import { provideOpenIddictPro } from '../providers/openiddict-pro.provider.js';
import { createOpenIddictProRoutes } from '../routes.js';
import { openIddictProExtensionsResolver } from './extensions.resolver.js';
import * as openIddict from '../index.js';

const injectors: ReturnType<typeof createInjector>[] = [];
afterEach(() => injectors.splice(0).forEach(injector => injector.destroy()));

describe('OpenIddict public extension contracts', () => {
  it('adds backend object properties before application form contributions', () => {
    const seen: string[] = [];
    const injector = createInjector(
      provideOpenIddictPro({
        createFormPropContributors: {
          [Keys.Applications]: [
            props => {
              if (props.find(prop => prop.name === 'ServerExtra')) seen.push(Keys.Applications);
            },
          ],
          [Keys.Scopes]: [
            props => {
              if (props.find(prop => prop.name === 'ServerExtra')) seen.push(Keys.Scopes);
            },
          ],
        },
      }),
    );
    injectors.push(injector);
    const config = injector.get(ConfigStateService);
    const entity = {
      properties: {
        ServerExtra: {
          type: 'System.String',
          ui: {
            onTable: { isVisible: true },
            onCreateForm: { isVisible: true },
            onEditForm: { isVisible: true },
          },
        },
      },
    };
    config.setState({
      ...config.snapshot(),
      objectExtensions: {
        modules: { OpenIddictPro: { entities: { ApiResource: entity, Scopes: entity } } },
      },
    });
    injector.runInContext(openIddictProExtensionsResolver);
    const extensions = injector.get(ExtensionsService);
    for (const key of Object.values(Keys)) {
      expect(
        extensions.entityProps
          .get(key)
          .props.toArray()
          .find(prop => prop.name === 'ServerExtra')?.isExtra,
      ).toBe(true);
      expect(
        extensions.createFormProps
          .get(key)
          .props.toArray()
          .find(prop => prop.name === 'ServerExtra')?.isExtra,
      ).toBe(true);
      expect(
        extensions.editFormProps
          .get(key)
          .props.toArray()
          .find(prop => prop.name === 'ServerExtra')?.isExtra,
      ).toBe(true);
    }
    expect(seen).toEqual([Keys.Applications, Keys.Scopes]);
  });

  it('exports the official reusable option lists and URI helpers', () => {
    for (const name of [
      'defaultApplicationTypes',
      'defaultApplicationsTypeList',
      'defaultApplicationTypesList',
      'DefaultApplicationsConsentType',
      'defaultClientAuthenticationMethods',
      'defaultUriPattern',
      'hashSetParser',
    ])
      expect(openIddict).toHaveProperty(name);
    expect(openIddict.defaultApplicationsTypeList.map(option => option.value)).toEqual([
      'confidential',
      'public',
    ]);
    expect(openIddict.defaultApplicationTypesList.map(option => option.value)).toEqual([
      'web',
      'native',
    ]);
    expect(openIddict.DefaultApplicationsConsentType.map(option => option.value)).toEqual([
      'explicit',
      'external',
      'implicit',
      'systematic',
    ]);
  });

  it('retains all five contribution sets for both component keys', () => {
    const seen: string[] = [];
    const track = (name: string) => () => {
      seen.push(name);
    };
    const injector = createInjector(
      provideOpenIddictPro({
        entityActionContributors: {
          [Keys.Applications]: [track('app:actions')],
          [Keys.Scopes]: [track('scope:actions')],
        },
        toolbarActionContributors: {
          [Keys.Applications]: [track('app:toolbar')],
          [Keys.Scopes]: [track('scope:toolbar')],
        },
        entityPropContributors: {
          [Keys.Applications]: [track('app:props')],
          [Keys.Scopes]: [track('scope:props')],
        },
        createFormPropContributors: {
          [Keys.Applications]: [track('app:create')],
          [Keys.Scopes]: [track('scope:create')],
        },
        editFormPropContributors: {
          [Keys.Applications]: [track('app:edit')],
          [Keys.Scopes]: [track('scope:edit')],
        },
      }),
    );
    injectors.push(injector);
    injector.runInContext(openIddictProExtensionsResolver);
    const extensions = injector.get(ExtensionsService);
    for (const key of Object.values(Keys)) {
      void extensions.entityActions.get(key).actions;
      void extensions.toolbarActions.get(key).actions;
      void extensions.entityProps.get(key).props;
      void extensions.createFormProps.get(key).props;
      void extensions.editFormProps.get(key).props;
    }
    expect(seen).toEqual([
      'app:actions',
      'app:toolbar',
      'app:props',
      'app:create',
      'app:edit',
      'scope:actions',
      'scope:toolbar',
      'scope:props',
      'scope:create',
      'scope:edit',
    ]);
  });

  it('keeps the official navigation paths, independent page policies and component keys', () => {
    const injector = createInjector([provideOpenIddictProConfig()]);
    injectors.push(injector);
    for (const initialize of injector.get(APP_INITIALIZERS, [])) injector.runInContext(initialize);
    const navigation = injector.get(RoutesService).flat.value;
    expect(navigation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/openiddict',
          requiredPolicy: Policy.Application,
          order: 3,
        }),
        expect.objectContaining({
          path: '/openiddict/Applications',
          requiredPolicy: Policy.Application,
        }),
        expect.objectContaining({ path: '/openiddict/Scopes', requiredPolicy: Policy.Scope }),
      ]),
    );
    const children = createOpenIddictProRoutes()[0]?.children;
    expect(children?.[1]?.meta?.replaceableComponent?.key).toBe('OpenIddictPro.Applications');
    expect(children?.[2]?.meta?.replaceableComponent?.key).toBe('OpenIddictPro.Scopes');
  });

  it('applies contributions to both DTOs and remains idempotent on repeated navigation', () => {
    const injector = createInjector(
      provideOpenIddictPro({
        entityPropContributors: {
          [Keys.Applications]: [
            props =>
              props.addTail(
                EntityProp.create<ApplicationDto>({ name: 'clientUri', type: PropType.String }),
              ),
          ],
        },
        createFormPropContributors: {
          [Keys.Scopes]: [
            props =>
              props.addTail(
                FormProp.create<ScopeDto>({ name: 'Extra', isExtra: true, type: PropType.String }),
              ),
          ],
        },
      }),
    );
    injectors.push(injector);
    injector.runInContext(openIddictProExtensionsResolver);
    injector.runInContext(openIddictProExtensionsResolver);
    const extensions = injector.get(ExtensionsService);
    expect(
      extensions.entityProps
        .get<ApplicationDto>(Keys.Applications)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['applicationType', 'clientId', 'displayName', 'clientType', 'clientUri']);
    expect(
      extensions.createFormProps
        .get<ScopeDto>(Keys.Scopes)
        .props.toArray()
        .map(prop => prop.name),
    ).toEqual(['name', 'displayName', 'description', 'resources', 'Extra']);
  });

  it('opens optional history with the exact persisted entity type', () => {
    const history = vi.fn();
    const injector = createInjector([{ provide: SHOW_ENTITY_HISTORY, useValue: history }]);
    injectors.push(injector);
    const action = DEFAULT_APPLICATIONS_ENTITY_ACTIONS.find(
      action => action.text === 'AbpOpenIddict::ChangeHistory',
    );
    const data = {
      record: { id: 'app-1' } as ApplicationDto,
      getInjected: injector.get.bind(injector),
    };
    expect(action?.visible(data)).toBe(true);
    action?.action(data);
    expect(history).toHaveBeenCalledWith(
      'app-1',
      'Volo.Abp.OpenIddict.Applications.OpenIddictApplication',
    );
  });

  it('offers every official application form field and explicit false defaults', () => {
    const names = DEFAULT_APPLICATIONS_CREATE_FORM_PROPS.map(prop => prop.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'applicationType',
        'clientId',
        'displayName',
        'clientUri',
        'logoUri',
        'clientType',
        'clientAuthMethod',
        'clientSecret',
        'jsonWebKeySet',
        'allowAuthorizationCodeFlow',
        'allowImplicitFlow',
        'allowHybridFlow',
        'allowPasswordFlow',
        'allowClientCredentialsFlow',
        'allowRefreshTokenFlow',
        'allowTokenExchangeFlow',
        'allowDeviceAuthorizationEndpoint',
        'forcePkce',
        'allowPushedAuthorizationEndpoint',
        'forcePushedAuthorization',
        'consentType',
        'extensionGrantTypes',
        'scopes',
        'redirectUris',
        'allowEndSessionEndpoint',
        'postLogoutRedirectUris',
      ]),
    );
    for (const prop of DEFAULT_APPLICATIONS_CREATE_FORM_PROPS.filter(
      prop => prop.type === PropType.Boolean,
    ))
      expect(prop.defaultValue).toBe(false);
  });
});
