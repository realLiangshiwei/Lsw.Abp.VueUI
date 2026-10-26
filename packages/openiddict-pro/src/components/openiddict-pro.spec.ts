import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
  SessionStateService,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { OpenIddictProPolicyNames as Policy } from '@lsw-abpvue/openiddict-pro/config';
import {
  ApplicationService,
  ScopeService,
  type ApplicationDto,
  type ScopeDto,
} from '@lsw-abpvue/openiddict-pro/proxy';
import { FormProp, type FormPropContributorCallback } from '@lsw-abpvue/components';
import { ConfirmationService, ConfirmationStatus, ToasterService } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { provideOpenIddictPro } from '../providers/openiddict-pro.provider.js';
import { openIddictProExtensionsResolver } from '../resolvers/extensions.resolver.js';
import type { OpenIddictProConfigOptions } from '../tokens/extensions.token.js';
import ApplicationsPage from './ApplicationsPage.vue';
import ScopesPage from './ScopesPage.vue';

const application: ApplicationDto = {
  id: 'app-1',
  applicationType: 'web',
  clientId: 'example',
  displayName: 'Example',
  clientType: 'confidential',
  allowPasswordFlow: false,
  allowClientCredentialsFlow: true,
  allowAuthorizationCodeFlow: true,
  allowRefreshTokenFlow: true,
  allowHybridFlow: false,
  allowImplicitFlow: false,
  allowTokenExchangeFlow: true,
  allowEndSessionEndpoint: true,
  allowDeviceAuthorizationEndpoint: true,
  forcePkce: true,
  allowPushedAuthorizationEndpoint: true,
  forcePushedAuthorization: false,
  redirectUris: ['https://example.test/callback'],
  postLogoutRedirectUris: ['https://example.test/logout'],
  frontChannelLogoutUri: 'https://example.test/frontchannel',
  scopes: ['example'],
  extraProperties: { Hidden: 'kept' },
};
const scope: ScopeDto = {
  id: 'scope-1',
  name: 'example',
  displayName: 'Example scope',
  description: 'Description',
  buildIn: false,
  resources: ['api-one', 'api-two'],
  extraProperties: { Hidden: 'kept' },
};
const wrappers: VueWrapper[] = [];
const injectors: ReturnType<typeof createInjector>[] = [];
afterEach(() => {
  wrappers.splice(0).forEach(page => page.unmount());
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

async function click(label: string): Promise<void> {
  const button = [
    ...(document.querySelector('[role="dialog"]') ?? document).querySelectorAll('button'),
  ].find(element => element.textContent?.trim() === label);
  if (!button) throw new TypeError(`No button is labelled ${label}.`);
  button.click();
  await flushPromises();
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function withDefaults<R>(defaults: Record<string, unknown>): FormPropContributorCallback<R> {
  return props => {
    for (const [name, defaultValue] of Object.entries(defaults)) {
      const index = props.findIndex(prop => prop.name === name);
      const existing = props.dropByIndex(index)?.value;
      if (existing) props.addByIndex(FormProp.create({ ...existing, defaultValue }), index);
    }
  };
}

async function render(
  component: Component,
  options: {
    apps?: Partial<ApplicationService>;
    scopes?: Partial<ScopeService>;
    policies?: string[];
    providers?: ProviderInput[];
    contributions?: OpenIddictProConfigOptions;
  } = {},
) {
  const apps: ApplicationService = {
    apiName: 'OpenIddictPro',
    getList: vi.fn(async () => ({ items: [application], totalCount: 1 })),
    get: vi.fn(async () => application),
    create: vi.fn(async () => application),
    update: vi.fn(async () => application),
    delete: vi.fn(async () => {}),
    getTokenLifetime: vi.fn(async () => ({ accessTokenLifetime: 120, issuedTokenLifetime: null })),
    setTokenLifetime: vi.fn(async () => {}),
    generateAccessToken: vi.fn(async () => ({
      accessToken: 'synthetic-result',
      tokenType: 'Bearer',
      expiresIn: 120,
      scope: 'example',
    })),
    ...options.apps,
  };
  const scopes: ScopeService = {
    apiName: 'OpenIddictPro',
    getList: vi.fn(async () => ({ items: [scope], totalCount: 1 })),
    getAllScopes: vi.fn(async () => [scope]),
    get: vi.fn(async () => scope),
    create: vi.fn(async () => scope),
    update: vi.fn(async () => scope),
    delete: vi.fn(async () => {}),
    ...options.scopes,
  };
  const warn = vi.fn(async () => ConfirmationStatus.confirm);
  const injector = createInjector([
    ...plainTheme.providers,
    ...provideOpenIddictPro(options.contributions),
    { provide: ApplicationService, useValue: apps },
    { provide: ScopeService, useValue: scopes },
    { provide: ConfirmationService, useValue: { warn } as unknown as ConfirmationService },
    ...(options.providers ?? []),
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  config.setState({
    ...config.snapshot(),
    currentUser: { ...config.snapshot().currentUser, id: 'user-1', isAuthenticated: true },
    auth: {
      grantedPolicies: Object.fromEntries(
        (options.policies ?? Object.values(Policy)).map(policy => [policy, true]),
      ),
    },
  });
  vi.spyOn(injector.get(LocalizationService), 't').mockImplementation(key =>
    typeof key === 'string' ? key : (key.key ?? ''),
  );
  injector.runInContext(openIddictProExtensionsResolver);
  const page: VueWrapper = mount(component, {
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => key },
      stubs: { RouterLink: true },
    },
  });
  wrappers.push(page);
  await flushPromises();
  return { page, apps, scopes, injector, config, warn };
}

describe('OpenIddict applications', () => {
  it('keeps the editor open and reloads after a detail read failure', async () => {
    const retry = deferred<ApplicationDto>();
    const get = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Unavailable'))
      .mockReturnValueOnce(retry.promise);
    const { page } = await render(ApplicationsPage, { apps: { get } });
    await click('AbpOpenIddict::Edit');
    expect(page.get('[role="dialog"]').text()).toContain('AbpUi::ErrorLoadingDatatable');
    await click('AbpUi::Refresh');
    expect(page.get('[role="dialog"]').text()).not.toContain('AbpUi::ErrorLoadingDatatable');
    retry.resolve(application);
    await flushPromises();
    expect(page.get('#clientId').element).toHaveProperty('value', 'example');
  });

  it('preserves create form defaults supplied by application contributors', async () => {
    const { page } = await render(ApplicationsPage, {
      contributions: {
        createFormPropContributors: {
          'OpenIddictPro.Applications': [
            withDefaults({
              clientType: 'confidential',
              clientAuthMethod: 'jwks',
              allowAuthorizationCodeFlow: true,
              redirectUris: 'com.example:/custom',
              extensionGrantTypes: 'custom_grant',
              jsonWebKeySet: '{"keys":[]}',
            }),
          ],
        },
      },
    });
    await click('AbpOpenIddict::NewApplication');
    expect(page.get('#clientAuthMethod').element).toHaveProperty('value', 'jwks');
    expect(page.get('#redirectUris').element).toHaveProperty('value', 'com.example:/custom');
    expect(page.get('#extensionGrantTypes').element).toHaveProperty('value', 'custom_grant');
  });

  it('shows the official columns and permission-gated operations', async () => {
    const { page } = await render(ApplicationsPage, { policies: [Policy.Application] });
    expect(page.text()).toContain('example');
    for (const name of ['ApplicationType', 'ClientId', 'DisplayName', 'ClientType'])
      expect(page.text()).toContain(`AbpOpenIddict::${name}`);
    expect(page.text()).not.toContain('AbpOpenIddict::NewApplication');
    expect(page.text()).not.toContain('AbpOpenIddict::GenerateAccessToken');
    expect(page.text()).not.toContain('AbpOpenIddict::ChangeHistory');
  });

  it('loads fresh details and preserves hidden values without resubmitting a secret', async () => {
    const { page, apps } = await render(ApplicationsPage);
    await click('AbpOpenIddict::Edit');
    expect(apps.get).toHaveBeenCalledWith('app-1', expect.anything());
    expect(page.get('#redirectUris').element).toHaveProperty(
      'value',
      application.redirectUris?.[0],
    );
    await page.get('#displayName').setValue('Renamed');
    await click('AbpOpenIddict::Save');
    expect(apps.update).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({
        displayName: 'Renamed',
        clientSecret: '',
        frontChannelLogoutUri: application.frontChannelLogoutUri,
        extraProperties: { Hidden: 'kept' },
        redirectUris: application.redirectUris,
        allowTokenExchangeFlow: true,
      }),
      expect.anything(),
    );
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('validates required fields and absolute URI lines before creating', async () => {
    const { page, apps } = await render(ApplicationsPage);
    await click('AbpOpenIddict::NewApplication');
    await click('AbpOpenIddict::Save');
    expect(apps.create).not.toHaveBeenCalled();
    await page.get('#applicationType').setValue('native');
    await page.get('#clientType').setValue('public');
    await page.get('#clientId').setValue('native-client');
    await page.get('#displayName').setValue('Native client');
    await page.get('#allowAuthorizationCodeFlow').setValue(true);
    await page.get('#redirectUris').setValue('/relative');
    await click('AbpOpenIddict::Save');
    expect(apps.create).not.toHaveBeenCalled();
    await page.get('#redirectUris').setValue('my-app:/callback\nhttps://example.test/callback');
    await click('AbpOpenIddict::Save');
    expect(apps.create).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUris: ['my-app:/callback', 'https://example.test/callback'],
        clientSecret: '',
        jsonWebKeySet: '',
        allowClientCredentialsFlow: false,
      }),
      expect.anything(),
    );
  });

  it('updates dependent controls when the client type and flows change', async () => {
    const { page } = await render(ApplicationsPage);
    await click('AbpOpenIddict::Edit');
    await page.get('#clientType').setValue('public');
    expect(page.get('#allowClientCredentialsFlow').attributes('disabled')).toBeDefined();
    expect(page.get('#allowDeviceAuthorizationEndpoint').attributes('disabled')).toBeDefined();
    expect(page.get('[role="dialog"]').text()).toContain('AbpOpenIddict::NotAvailableForThisType');
    expect(page.find('#clientAuthMethod').exists()).toBe(false);
    await page.get('#allowAuthorizationCodeFlow').setValue(false);
    expect(page.get('#allowRefreshTokenFlow').attributes('disabled')).toBeDefined();
    expect(page.find('#redirectUris').exists()).toBe(false);
    await page.get('#forcePushedAuthorization').setValue(true);
    expect(page.get('#allowPushedAuthorizationEndpoint').element).toHaveProperty('checked', true);
    expect(page.get('#allowPushedAuthorizationEndpoint').attributes('disabled')).toBeDefined();
  });

  it('switches between secret and JWKS authentication and removes form-only fields', async () => {
    const { page, apps } = await render(ApplicationsPage);
    await click('AbpOpenIddict::Edit');
    await page.get('#clientAuthMethod').setValue('jwks');
    expect(page.find('#clientSecret').exists()).toBe(false);
    await page.get('#jsonWebKeySet').setValue('{"keys":[]}');
    await click('AbpOpenIddict::Save');
    const body = vi.mocked(apps.update).mock.calls[0]?.[1];
    expect(body).toMatchObject({ jsonWebKeySet: '{"keys":[]}', clientSecret: '' });
    expect(body).not.toHaveProperty('clientAuthMethod');
    expect(body).not.toHaveProperty('id');
  });

  it('retains the editor draft after a rejected save and retries once', async () => {
    const update = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Refused'))
      .mockResolvedValue(application);
    const { page } = await render(ApplicationsPage, { apps: { update } });
    await click('AbpOpenIddict::Edit');
    await page.get('#displayName').setValue('Retained');
    await click('AbpOpenIddict::Save');
    expect(page.get('#displayName').element).toHaveProperty('value', 'Retained');
    await click('AbpOpenIddict::Save');
    expect(update).toHaveBeenCalledTimes(2);
    expect(page.find('[role="dialog"]').exists()).toBe(false);
  });

  it('discards a delayed detail response after a tenant change', async () => {
    const pending = deferred<ApplicationDto>();
    const { page, injector } = await render(ApplicationsPage, {
      apps: { get: vi.fn(() => pending.promise) },
    });
    await click('AbpOpenIddict::Edit');
    injector
      .get(SessionStateService)
      .setTenant({ id: 'other-tenant', name: 'Other', isAvailable: true });
    pending.resolve(application);
    await flushPromises();
    expect(page.find('[role="dialog"]').exists()).toBe(false);
    expect(page.text()).not.toContain('example');
  });

  it('requires confirmation before deleting and refreshes the current query', async () => {
    const { apps, warn } = await render(ApplicationsPage);
    await click('LanguageManagement::Delete');
    expect(warn).toHaveBeenCalledWith(
      'AbpOpenIddict::ApplicationDeletionWarningMessage',
      expect.anything(),
      expect.objectContaining({ messageLocalizationParams: ['example'] }),
    );
    expect(apps.delete).toHaveBeenCalledWith('app-1', expect.anything());
  });

  it('loads all eight token lifetimes and allows defaults, fractions and negative values', async () => {
    const { page, apps } = await render(ApplicationsPage);
    await click('AbpOpenIddict::TokenLifetime');
    expect(page.findAll('input[type="number"]')).toHaveLength(8);
    await page.get('#accessTokenLifetime').setValue('');
    await page.get('#issuedTokenLifetime').setValue('-1.5');
    await click('AbpOpenIddict::Save');
    expect(apps.setTokenLifetime).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ accessTokenLifetime: null, issuedTokenLifetime: -1.5 }),
      expect.anything(),
    );
  });

  it('retains lifetime edits after a failure and rejects values outside the official range', async () => {
    const setTokenLifetime = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Refused'))
      .mockResolvedValue(undefined);
    const { page } = await render(ApplicationsPage, { apps: { setTokenLifetime } });
    await click('AbpOpenIddict::TokenLifetime');
    await page.get('#accessTokenLifetime').setValue('922337203686');
    await click('AbpOpenIddict::Save');
    expect(setTokenLifetime).not.toHaveBeenCalled();
    await page.get('#accessTokenLifetime').setValue('180');
    await click('AbpOpenIddict::Save');
    expect(page.get('#accessTokenLifetime').element).toHaveProperty('value', '180');
    await click('AbpOpenIddict::Save');
    expect(setTokenLifetime).toHaveBeenCalledTimes(2);
  });

  it('requires a secret and generates only the selected allowed scopes', async () => {
    const { page, apps } = await render(ApplicationsPage);
    await click('AbpOpenIddict::GenerateAccessToken');
    await click('AbpOpenIddict::GenerateAccessToken');
    expect(apps.generateAccessToken).not.toHaveBeenCalled();
    await page.get('#token-client-secret').setValue('synthetic-secret');
    await page.get('#token-scopes').setValue(['example']);
    await click('AbpOpenIddict::GenerateAccessToken');
    expect(apps.generateAccessToken).toHaveBeenCalledWith(
      'app-1',
      { clientSecret: 'synthetic-secret', scopes: ['example'] },
      expect.anything(),
    );
    expect(page.get('#generated-access-token').element).toHaveProperty('value', 'synthetic-result');
    expect(page.text()).toContain('Bearer');
  });

  it('rechecks client credentials eligibility from current details', async () => {
    const { page, apps } = await render(ApplicationsPage, {
      apps: { get: vi.fn(async () => ({ ...application, allowClientCredentialsFlow: false })) },
    });
    await click('AbpOpenIddict::GenerateAccessToken');
    expect(page.text()).toContain(
      'AbpOpenIddict::ClientCredentialsFlowNotEnabledForThisApplication',
    );
    expect(page.find('#token-client-secret').exists()).toBe(false);
    expect(apps.generateAccessToken).not.toHaveBeenCalled();
  });

  it('does not show a clipboard completion after the page is unmounted', async () => {
    const copied = deferred<void>();
    vi.spyOn(window.navigator.clipboard, 'writeText').mockReturnValue(copied.promise);
    const { page, injector } = await render(ApplicationsPage);
    const success = vi.spyOn(injector.get(ToasterService), 'success');
    await click('AbpOpenIddict::GenerateAccessToken');
    await page.get('#token-client-secret').setValue('synthetic-secret');
    await click('AbpOpenIddict::GenerateAccessToken');
    await click('AbpOpenIddict::CopyToClipboard');
    page.unmount();
    copied.resolve();
    await flushPromises();
    expect(success).not.toHaveBeenCalled();
  });
});

describe('OpenIddict scopes', () => {
  it('preserves resource defaults supplied by scope contributors', async () => {
    const { page, scopes } = await render(ScopesPage, {
      contributions: {
        createFormPropContributors: {
          'OpenIddictPro.Scopes': [
            withDefaults({ name: 'custom_scope', resources: 'api_three\napi_four' }),
          ],
        },
      },
    });
    await click('AbpOpenIddict::NewScope');
    expect(page.get('#resources').element).toHaveProperty('value', 'api_three\napi_four');
    await click('AbpOpenIddict::Save');
    expect(scopes.create).toHaveBeenCalledWith(
      expect.objectContaining({ resources: ['api_three', 'api_four'] }),
      expect.anything(),
    );
  });

  it('validates names and round-trips resources as separate lines', async () => {
    const { page, scopes } = await render(ScopesPage);
    await click('AbpOpenIddict::Edit');
    expect(page.get('#resources').element).toHaveProperty('value', 'api-one\napi-two');
    await page.get('#name').setValue('invalid name');
    await click('AbpOpenIddict::Save');
    expect(scopes.update).not.toHaveBeenCalled();
    await page.get('#name').setValue('renamed');
    await page.get('#resources').setValue('api-three\napi-four');
    await click('AbpOpenIddict::Save');
    expect(scopes.update).toHaveBeenCalledWith(
      'scope-1',
      expect.objectContaining({
        name: 'renamed',
        resources: ['api-three', 'api-four'],
        extraProperties: { Hidden: 'kept' },
      }),
      expect.anything(),
    );
  });

  it('clears resources explicitly and preserves an empty optional description', async () => {
    const { page, scopes } = await render(ScopesPage);
    await click('AbpOpenIddict::Edit');
    await page.get('#resources').setValue('');
    await page.get('#description').setValue('');
    await click('AbpOpenIddict::Save');
    expect(scopes.update).toHaveBeenCalledWith(
      'scope-1',
      expect.objectContaining({ resources: [], description: '' }),
      expect.anything(),
    );
  });
});
