import {
  AbpTenantService,
  AuthService,
  ConfigStateService,
  createInjector,
  EnvironmentService,
  MultiTenancyService,
  SessionStateService,
  StorageService,
  WindowService,
} from '@lsw-abpvue/core';
import type { Injector } from '@lsw-abpvue/core';
import { ACCOUNT_PRO_OPTIONS } from '@lsw-abpvue/account-pro/config';
import type { AccountProOptions } from '@lsw-abpvue/account-pro/config';
import { IdentityLinkUserService } from '@lsw-abpvue/account-pro/proxy';
import type { LinkUserDto } from '@lsw-abpvue/account-pro/proxy';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { AccountWorkflowsService } from './account-workflows.service.js';
const sourceId = '00000000-0000-0000-0000-000000000001';
const targetId = '00000000-0000-0000-0000-000000000002';
const tenantId = '00000000-0000-0000-0000-000000000003';
const nonce = '00000000-0000-0000-0000-000000000004';
const injectors: Injector[] = [];
afterEach(() => {
  injectors.splice(0).forEach(injector => injector.destroy());
  vi.restoreAllMocks();
});
function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
function setup(options: AccountProOptions = {}) {
  const authenticated = ref(true);
  const domainTenant = ref<{ id: string } | null>(null);
  let selectedTenant: { id?: string | null | undefined } | null = null;
  const tenantLookup = vi.fn(() =>
    Promise.resolve({ success: true, tenantId, name: 'Source tenant' }),
  );
  const session = {
    getTenant: () => selectedTenant,
    setTenant: vi.fn((tenant: { id?: string | null | undefined } | null) => {
      selectedTenant = tenant;
    }),
  };
  const sessionValues = new Map<string, string>();
  const ledgerValues = new Map<string, string>();
  const location = {
    origin: 'http://localhost:5179',
    pathname: '/account/workflows',
    search: '',
    hash: '',
    assign: vi.fn(),
  };
  const native = {
    location,
    crypto: { randomUUID: () => nonce },
    history: { state: {}, replaceState: vi.fn() },
    sessionStorage: {
      getItem: (key: string) => sessionValues.get(key) ?? null,
      setItem: (key: string, value: string) => void sessionValues.set(key, value),
      removeItem: (key: string) => void sessionValues.delete(key),
    },
  };
  const auth = {
    isAuthenticated: computed(() => authenticated.value),
    loginUsingGrant: vi.fn(() => Promise.resolve({})),
    clearSession: vi.fn(() => {
      authenticated.value = false;
      return Promise.resolve();
    }),
    navigateToLogin: vi.fn(() => Promise.resolve()),
  };
  const api = {
    generateLinkToken: vi.fn(() => Promise.resolve('target-bound-proof')),
    getAllList: vi.fn<() => Promise<{ items: LinkUserDto[] }>>(() =>
      Promise.resolve({
        items: [
          { targetUserId: targetId, targetUserName: 'Fresh target name', directlyLinked: true },
        ],
      }),
    ),
  };
  const injector = createInjector([
    { provide: AuthService, useValue: auth },
    { provide: AbpTenantService, useValue: { findTenantByName: tenantLookup } },
    {
      provide: MultiTenancyService,
      useValue: { domainTenant: computed(() => domainTenant.value) },
    },
    { provide: SessionStateService, useValue: session },
    { provide: WindowService, useValue: { nativeWindow: native as unknown as Window } },
    {
      provide: StorageService,
      useValue: {
        getItem: (key: string) => ledgerValues.get(key) ?? null,
        setItem: (key: string, value: string) => void ledgerValues.set(key, value),
      },
    },
    { provide: IdentityLinkUserService, useValue: api },
    { provide: ACCOUNT_PRO_OPTIONS, useValue: { hostOrigin: 'http://localhost:5179', ...options } },
  ]);
  injectors.push(injector);
  const config = injector.get(ConfigStateService);
  vi.spyOn(config, 'refreshAppState').mockImplementation(() => Promise.resolve(config.snapshot()));
  const state = config.snapshot();
  config.setState({
    ...state,
    currentUser: {
      ...state.currentUser,
      id: sourceId,
      userName: 'Fresh source name',
      isAuthenticated: true,
    },
    currentTenant: { isAvailable: true },
  });
  const environment = injector.get(EnvironmentService);
  environment.setState({
    ...environment.getEnvironment(),
    oAuthConfig: { issuer: 'https://authority.example/' },
  });
  function intent(changes: Record<string, unknown> = {}) {
    const value = {
      sourceOrigin: 'http://localhost:5179',
      sourceUserId: sourceId,
      targetUserId: targetId,
      nonce,
      issuedAt: Date.now(),
      ...changes,
    };
    location.hash = `#${new URLSearchParams({ accountLinkHandoff: JSON.stringify(value) })}`;
    return location.hash;
  }
  return {
    workflow: injector.get(AccountWorkflowsService),
    tenantLookup,
    session,
    domainTenant,
    auth,
    api,
    native,
    location,
    sessionValues,
    ledgerValues,
    config,
    authenticated,
    environment,
    intent,
  };
}
describe('account protocol orchestration', () => {
  it('authenticates a new link on the official authority with a target-bound credential', async () => {
    const test = setup();
    await test.workflow.beginLink('  target@example.test  ');
    expect(test.api.generateLinkToken).toHaveBeenCalledWith(
      { targetUserNameOrEmail: 'target@example.test' },
      expect.any(Object),
    );
    expect(test.auth.clearSession).not.toHaveBeenCalled();
    expect(test.authenticated.value).toBe(true);
    const destination = new URL(test.location.assign.mock.calls[0]?.[0] as unknown as string);
    expect(destination.origin).toBe('https://authority.example');
    expect(destination.pathname).toBe('/Account/Login');
    expect(destination.searchParams.get('LinkUserId')).toBe(sourceId);
    expect(destination.searchParams.get('LinkToken')).toBe('target-bound-proof');
    const returned = new URL(destination.searchParams.get('ReturnUrl') ?? '');
    expect(returned.origin + returned.pathname).toBe('http://localhost:5179/account/workflows');
    expect(returned.searchParams.get('handler')).toBe('linkLogin');
    expect(returned.searchParams.get('linkUserId')).toBe(sourceId);
    expect(returned.searchParams.has('linkTenantId')).toBe(false);
    expect([...destination.searchParams.keys()]).not.toContain('access_token');
    expect(test.sessionValues.size).toBe(0);
  });
  it('rejects non-HTTP loopback authorities before issuing a link credential', async () => {
    const test = setup();
    test.environment.setState({
      ...test.environment.getEnvironment(),
      oAuthConfig: { issuer: 'ftp://localhost/' },
    });
    await expect(test.workflow.beginLink('target@example.test')).rejects.toThrow('HTTPS');
    expect(test.api.generateLinkToken).not.toHaveBeenCalled();
  });
  it('does not normalize an application return path into an external origin', async () => {
    const test = setup({ linkReturnPath: '/\r\n/evil.test' });
    await expect(test.workflow.beginLink('target@example.test')).rejects.toThrow(
      'application-relative',
    );
    expect(test.auth.clearSession).not.toHaveBeenCalled();
  });
  it('uses the standard same-origin LinkLogin grant and explicit target tenant', async () => {
    const test = setup();
    await test.workflow.loginAs({
      targetUserId: targetId,
      targetTenantId: tenantId,
      directlyLinked: true,
    });
    expect(test.auth.loginUsingGrant).toHaveBeenCalledWith(
      'LinkLogin',
      { LinkUserId: targetId, LinkTenantId: tenantId },
      expect.objectContaining({
        tenant: expect.objectContaining({ id: tenantId }),
        allowedTenantOrigins: ['http://localhost:5179'],
      }),
    );
    expect(test.location.assign).not.toHaveBeenCalled();
  });
  it('sends only a bounded navigation intent to an explicitly mapped origin', async () => {
    const test = setup({
      trustedOrigins: ['http://localhost:5179', 'http://127.0.0.1:5179'],
      tenantOrigins: { [tenantId]: 'http://127.0.0.1:5179' },
    });
    await test.workflow.loginAs({
      targetUserId: targetId,
      targetTenantId: tenantId,
      directlyLinked: false,
    });
    const destination = new URL(test.location.assign.mock.calls[0]?.[0] as unknown as string);
    const payload = JSON.parse(
      new URLSearchParams(destination.hash.slice(1)).get('accountLinkHandoff') ?? '{}',
    ) as Record<string, unknown>;
    expect(destination.origin).toBe('http://127.0.0.1:5179');
    expect(destination.search).toBe('');
    expect(payload).toMatchObject({ sourceUserId: sourceId, targetUserId: targetId, nonce });
    expect(Object.keys(payload).some(key => /token/i.test(key))).toBe(false);
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('rejects an untrusted destination before account navigation', async () => {
    const test = setup({
      trustedOrigins: ['http://localhost:5179'],
      tenantOrigins: { [tenantId]: 'https://evil.test' },
    });
    await expect(
      test.workflow.loginAs({
        targetUserId: targetId,
        targetTenantId: tenantId,
        directlyLinked: true,
      }),
    ).rejects.toThrow('not trusted');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('clears the fragment before reading fresh names and requires explicit confirmation', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.intent();
    expect(await test.workflow.resumeHandoff()).toBe(true);
    expect(test.native.history.replaceState).toHaveBeenCalledWith({}, '', '/account/workflows');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
    expect(test.workflow.pendingHandoff.value).toMatchObject({
      sourceUserName: 'Fresh source name',
      target: { targetUserId: targetId, targetUserName: 'Fresh target name' },
    });
    expect(test.sessionValues.size).toBe(0);
    await test.workflow.confirmHandoff();
    expect(test.api.getAllList).toHaveBeenCalledTimes(2);
    expect(test.auth.loginUsingGrant).toHaveBeenCalledWith(
      'LinkLogin',
      { LinkUserId: targetId },
      expect.any(Object),
    );
    expect(test.workflow.pendingHandoff.value).toBeNull();
  });
  it('uses ordinary PKCE before previewing any cross-origin account intent', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.authenticated.value = false;
    test.intent();
    await test.workflow.resumeHandoff();
    expect(test.auth.navigateToLogin).toHaveBeenCalledWith('/account/workflows', {
      prompt: 'login',
    });
    expect(test.api.getAllList).not.toHaveBeenCalled();
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
    expect(test.sessionValues.size).toBe(1);
    expect([...test.sessionValues.values()].join('')).not.toMatch(/token/i);
  });
  it('resolves the source tenant through the standard lookup before requesting tenant PKCE', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.authenticated.value = false;
    test.intent({ sourceTenantId: tenantId, sourceTenantName: 'Source tenant' });
    await test.workflow.resumeHandoff();
    expect(test.tenantLookup).toHaveBeenCalledWith('Source%20tenant', expect.any(Object));
    expect(test.session.setTenant).toHaveBeenCalledWith({
      id: tenantId,
      name: 'Source tenant',
      isAvailable: true,
    });
    expect(test.auth.navigateToLogin).toHaveBeenCalledWith('/account/workflows', {
      prompt: 'login',
      __tenant: tenantId,
    });
  });
  it('refuses a domain-pinned tenant mismatch before starting source authentication', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.authenticated.value = false;
    test.domainTenant.value = { id: tenantId };
    test.intent();
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('source tenant');
    expect(test.auth.navigateToLogin).not.toHaveBeenCalled();
  });
  it('does not overwrite a newer authenticated tenant after a delayed source lookup', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    const lookup = deferred<{ success: boolean; tenantId: string; name: string }>();
    test.tenantLookup.mockImplementation(() => lookup.promise);
    test.authenticated.value = false;
    test.intent({ sourceTenantId: tenantId, sourceTenantName: 'Source tenant' });
    const operation = test.workflow.resumeHandoff();
    test.authenticated.value = true;
    lookup.resolve({ success: true, tenantId, name: 'Source tenant' });
    await expect(operation).rejects.toThrow('changed');
    expect(test.session.setTenant).not.toHaveBeenCalled();
    expect(test.auth.navigateToLogin).not.toHaveBeenCalled();
  });
  it('discards cancelled authentication instead of entering a redirect loop', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.authenticated.value = false;
    test.intent();
    await test.workflow.resumeHandoff();
    test.location.hash = '';
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('cancelled');
    expect(test.auth.navigateToLogin).toHaveBeenCalledTimes(1);
    expect(test.sessionValues.size).toBe(0);
  });
  it('rejects a source account mismatch before reading linked users', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.intent({ sourceUserId: targetId });
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('source account');
    expect(test.api.getAllList).not.toHaveBeenCalled();
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('rejects a source tenant mismatch even when the user identifier matches', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.intent({ sourceTenantId: tenantId, sourceTenantName: 'Source tenant' });
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('source account');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('requires an explicit receiver mapping instead of trusting an arbitrary allowed origin', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'], hostOrigin: undefined });
    test.intent();
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('configured');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('requires current server membership before presenting a target for confirmation', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.api.getAllList.mockResolvedValue({ items: [] });
    test.intent();
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('no longer linked');
    expect(test.workflow.pendingHandoff.value).toBeNull();
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('rechecks the receiver destination immediately before a confirmed grant', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179', 'http://127.0.0.1:5179'] });
    test.intent();
    await test.workflow.resumeHandoff();
    const pending = deferred<{ items: LinkUserDto[] }>();
    test.api.getAllList.mockImplementation(() => pending.promise);
    const operation = test.workflow.confirmHandoff();
    test.location.origin = 'http://127.0.0.1:5179';
    pending.resolve({ items: [{ targetUserId: targetId, directlyLinked: true }] });
    await expect(operation).rejects.toThrow('configured');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('checks fresh membership again when a link was revoked after preview', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.intent();
    await test.workflow.resumeHandoff();
    test.api.getAllList.mockResolvedValue({ items: [] });
    await expect(test.workflow.confirmHandoff()).rejects.toThrow('no longer linked');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
    expect(test.workflow.pendingHandoff.value).toBeNull();
  });
  it('consumes a cancelled intent and refuses an exact repeated fragment', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    const fragment = test.intent();
    await test.workflow.resumeHandoff();
    test.workflow.cancelHandoff();
    test.location.hash = fragment;
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('already used');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('consumes a confirmed intent and never replays its grant', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    const fragment = test.intent();
    await test.workflow.resumeHandoff();
    await test.workflow.confirmHandoff();
    test.location.hash = fragment;
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('already used');
    expect(test.auth.loginUsingGrant).toHaveBeenCalledOnce();
  });
  it('does not clear a newer identity after a delayed target-link credential arrives', async () => {
    const test = setup();
    const pending = deferred<string>();
    test.api.generateLinkToken.mockImplementation(() => pending.promise);
    const operation = test.workflow.beginLink('target@example.test');
    test.config.setState({
      ...test.config.snapshot(),
      currentUser: { ...test.config.snapshot().currentUser, id: targetId },
    });
    pending.resolve('late-proof');
    await expect(operation).rejects.toThrow('changed');
    expect(test.auth.clearSession).not.toHaveBeenCalled();
    expect(test.location.assign).not.toHaveBeenCalled();
  });
  it('discards a late target list after its source identity changed', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    const pending = deferred<{ items: LinkUserDto[] }>();
    test.api.getAllList.mockImplementation(() => pending.promise);
    test.intent();
    const operation = test.workflow.resumeHandoff();
    test.config.setState({
      ...test.config.snapshot(),
      currentUser: { ...test.config.snapshot().currentUser, id: targetId },
    });
    pending.resolve({ items: [{ targetUserId: targetId, directlyLinked: true }] });
    await expect(operation).rejects.toThrow('changed');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
    expect(test.workflow.pendingHandoff.value).toBeNull();
  });
  it('does not populate a preview after its page cancelled a delayed read', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    const pending = deferred<{ items: LinkUserDto[] }>();
    test.api.getAllList.mockImplementation(() => pending.promise);
    const fragment = test.intent();
    const operation = test.workflow.resumeHandoff();
    test.workflow.cancelHandoff();
    pending.resolve({ items: [{ targetUserId: targetId, directlyLinked: true }] });
    await expect(operation).rejects.toThrow('cancelled');
    expect(test.workflow.pendingHandoff.value).toBeNull();
    test.location.hash = fragment;
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('already used');
  });
  it('does not grant after source identity changes while confirmation is reading', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    test.intent();
    await test.workflow.resumeHandoff();
    const pending = deferred<{ items: LinkUserDto[] }>();
    test.api.getAllList.mockImplementation(() => pending.promise);
    const operation = test.workflow.confirmHandoff();
    test.config.setState({
      ...test.config.snapshot(),
      currentUser: { ...test.config.snapshot().currentUser, id: targetId },
    });
    pending.resolve({ items: [{ targetUserId: targetId, directlyLinked: true }] });
    await expect(operation).rejects.toThrow('changed');
    expect(test.auth.loginUsingGrant).not.toHaveBeenCalled();
  });
  it('consumes a refused grant intent and preserves explicit user control for a new attempt', async () => {
    const test = setup({ trustedOrigins: ['http://localhost:5179'] });
    const fragment = test.intent();
    await test.workflow.resumeHandoff();
    test.auth.loginUsingGrant.mockRejectedValueOnce(new Error('refused'));
    await expect(test.workflow.confirmHandoff()).rejects.toThrow('refused');
    test.location.hash = fragment;
    await expect(test.workflow.resumeHandoff()).rejects.toThrow('already used');
    expect(test.auth.loginUsingGrant).toHaveBeenCalledOnce();
  });
  it('returns through the server Impersonation grant without restoring old credentials', async () => {
    const test = setup();
    await test.workflow.returnToImpersonator();
    expect(test.auth.loginUsingGrant).toHaveBeenCalledWith('Impersonation', {}, expect.any(Object));
    expect(test.sessionValues.size).toBe(0);
  });
  it('uses exact commercial user impersonation parameters and verifies the tenant', async () => {
    const test = setup();
    await test.workflow.impersonateUser(targetId, tenantId);
    expect(test.auth.loginUsingGrant).toHaveBeenCalledWith(
      'Impersonation',
      { UserId: targetId, TenantId: tenantId },
      expect.objectContaining({
        tenant: { id: tenantId, isAvailable: true },
        allowedTenantOrigins: ['http://localhost:5179'],
      }),
    );
  });
  it('uses UserDelegationId and omits TenantId when switching to Host', async () => {
    const test = setup();
    await test.workflow.useDelegation(targetId);
    await test.workflow.switchTenant(null);
    expect(test.auth.loginUsingGrant).toHaveBeenNthCalledWith(
      1,
      'Impersonation',
      { UserDelegationId: targetId },
      expect.any(Object),
    );
    expect(test.auth.loginUsingGrant).toHaveBeenNthCalledWith(
      2,
      'SwitchTenant',
      {},
      expect.objectContaining({ tenant: null }),
    );
  });
});
