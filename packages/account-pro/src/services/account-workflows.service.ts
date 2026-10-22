import {
  AbpTenantService,
  AuthService,
  ConfigStateService,
  defineService,
  EnvironmentService,
  inject,
  MultiTenancyService,
  SessionStateService,
  StorageService,
  TENANT_KEY,
  WindowService,
} from '@lsw-abpvue/core';
import type { CurrentTenantDto, ServiceOf } from '@lsw-abpvue/core';
import { ACCOUNT_PRO_OPTIONS } from '@lsw-abpvue/account-pro/config';
import { IdentityLinkUserService } from '@lsw-abpvue/account-pro/proxy';
import type { LinkUserDto } from '@lsw-abpvue/account-pro/proxy';
import { computed, shallowRef } from 'vue';
import { parseAccountLinkHandoff, trustedAccountOrigin } from '../utils/account-workflows.js';
import type { AccountLinkHandoff } from '../utils/account-workflows.js';
export interface AccountLinkHandoffPreview {
  sourceUserName: string;
  sourceTenantName: string | null;
  target: LinkUserDto;
}
export class AccountWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountWorkflowError';
  }
}
export const AccountWorkflowsService = defineService('AccountWorkflowsService', () => {
  const auth = inject(AuthService);
  const config = inject(ConfigStateService);
  const environment = inject(EnvironmentService);
  const windowService = inject(WindowService);
  const storage = inject(StorageService);
  const link = inject(IdentityLinkUserService);
  const options = inject(ACCOUNT_PRO_OPTIONS);
  const tenants = inject(AbpTenantService);
  const tenancy = inject(MultiTenancyService);
  const session = inject(SessionStateService);
  const tenantKey = inject(TENANT_KEY);
  const pendingKey = 'abp.account-pro.pending-link-handoff';
  const consumedKey = 'abp.account-pro.consumed-link-intents';
  let handoffRevision = 0;
  let activeIntent: AccountLinkHandoff | null = null;
  const pending = shallowRef<{
    intent: AccountLinkHandoff;
    context: string;
    preview: AccountLinkHandoffPreview;
  } | null>(null);
  function identityContext() {
    const snapshot = config.snapshot();
    return JSON.stringify([
      snapshot.currentUser.id,
      snapshot.currentUser.isAuthenticated,
      snapshot.currentTenant.id,
      snapshot.currentUser.impersonatorUserId,
      snapshot.currentUser.impersonatorTenantId,
    ]);
  }
  function assertContext(context: string) {
    if (!auth.isAuthenticated.value || identityContext() !== context)
      throw new AccountWorkflowError(
        'The active account changed. Start the account operation again.',
      );
  }
  function nativeWindow() {
    const native = windowService.nativeWindow;
    if (!native) throw new AccountWorkflowError('Account navigation requires a browser.');
    return native;
  }
  function grant(
    grantType: string,
    parameters: Readonly<Record<string, string>>,
    tenant?: CurrentTenantDto | null,
  ) {
    if (!auth.loginUsingGrant)
      throw new AccountWorkflowError('The authentication provider must support custom grants.');
    return auth.loginUsingGrant(grantType, parameters, {
      tenant,
      redirectUrl: '/account/workflows',
      allowedTenantOrigins: [nativeWindow().location.origin],
    });
  }
  function validReturnPath() {
    const path = options.linkReturnPath ?? '/account/workflows';
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      /[\\?#]/.test(path) ||
      new URL(path, 'https://return.invalid').origin !== 'https://return.invalid'
    )
      throw new AccountWorkflowError('Configure an application-relative account return path.');
    return path;
  }
  function consumed() {
    try {
      const data: unknown = JSON.parse(storage.getItem(consumedKey) ?? '[]');
      if (!Array.isArray(data)) return [];
      return data
        .filter((item): item is { nonce: string; expiresAt: number } =>
          Boolean(
            item &&
            typeof item === 'object' &&
            typeof item.nonce === 'string' &&
            typeof item.expiresAt === 'number' &&
            item.expiresAt > Date.now(),
          ),
        )
        .slice(-127);
    } catch {
      return [];
    }
  }
  function isConsumed(intent: AccountLinkHandoff) {
    return consumed().some(item => item.nonce === intent.nonce);
  }
  function consume(intent: AccountLinkHandoff) {
    if (isConsumed(intent))
      throw new AccountWorkflowError(
        'The linked account navigation intent has already been used. Start again.',
      );
    storage.setItem(
      consumedKey,
      JSON.stringify([...consumed(), { nonce: intent.nonce, expiresAt: intent.issuedAt + 330000 }]),
    );
  }
  function cancelHandoff() {
    handoffRevision++;
    const intent = activeIntent;
    activeIntent = null;
    pending.value = null;
    nativeWindow().sessionStorage.removeItem(pendingKey);
    if (intent && !isConsumed(intent)) consume(intent);
  }
  function matchingTarget(items: readonly LinkUserDto[], intent: AccountLinkHandoff) {
    return items.find(
      item =>
        item.targetUserId === intent.targetUserId &&
        (item.targetTenantId ?? null) === (intent.targetTenantId ?? null),
    );
  }
  function assertDestination(intent: AccountLinkHandoff) {
    const mapped = intent.targetTenantId
      ? options.tenantOrigins?.[intent.targetTenantId]
      : options.hostOrigin;
    if (
      !mapped ||
      trustedAccountOrigin(mapped, options.trustedOrigins ?? []) !== nativeWindow().location.origin
    )
      throw new AccountWorkflowError(
        'This application is not the configured linked account destination.',
      );
  }
  async function loginAs(record: LinkUserDto) {
    const native = nativeWindow();
    const target = record.targetTenantId
      ? options.tenantOrigins?.[record.targetTenantId]
      : options.hostOrigin;
    if (target && new URL(target).origin !== native.location.origin) {
      const allowed = options.trustedOrigins ?? [];
      const origin = trustedAccountOrigin(target, allowed);
      if (!origin || !trustedAccountOrigin(native.location.origin, allowed))
        throw new AccountWorkflowError('The linked account destination is not trusted.');
      const current = config.snapshot();
      if (!current.currentUser.id || !auth.isAuthenticated.value)
        throw new AccountWorkflowError('Sign in before switching linked accounts.');
      const intent: AccountLinkHandoff = {
        sourceOrigin: native.location.origin,
        sourceUserId: current.currentUser.id,
        sourceTenantId: current.currentTenant.id,
        sourceTenantName: current.currentTenant.id ? current.currentTenant.name : null,
        targetUserId: record.targetUserId,
        targetTenantId: record.targetTenantId,
        nonce: native.crypto.randomUUID(),
        issuedAt: Date.now(),
      };
      const destination = new URL(validReturnPath(), origin);
      destination.hash = new URLSearchParams({
        accountLinkHandoff: JSON.stringify(intent),
      }).toString();
      native.location.assign(destination.href);
      return;
    }
    await grant(
      'LinkLogin',
      {
        LinkUserId: record.targetUserId,
        ...(record.targetTenantId ? { LinkTenantId: record.targetTenantId } : {}),
      },
      {
        id: record.targetTenantId ?? null,
        name: record.targetTenantName ?? null,
        isAvailable: true,
      },
    );
  }
  async function beginLink(targetUserNameOrEmail: string) {
    const target = targetUserNameOrEmail.trim();
    if (!target) throw new AccountWorkflowError('Enter the account user name or email address.');
    const path = validReturnPath();
    const native = nativeWindow();
    const issuer = environment.getEnvironment().oAuthConfig?.issuer;
    if (!issuer)
      throw new AccountWorkflowError('Configure the account authority before linking an account.');
    const authority = new URL(issuer);
    if (
      authority.username ||
      authority.password ||
      (authority.protocol !== 'https:' &&
        !(
          authority.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(authority.hostname)
        ))
    )
      throw new AccountWorkflowError('The account authority must use HTTPS.');
    const current = config.snapshot();
    if (!current.currentUser.id || !auth.isAuthenticated.value)
      throw new AccountWorkflowError('Sign in before linking an account.');
    const context = identityContext();
    const token = await link.generateLinkToken(
      { targetUserNameOrEmail: target },
      { skipHandleError: true },
    );
    assertContext(context);
    const destination = new URL('Account/Login', issuer.endsWith('/') ? issuer : `${issuer}/`);
    destination.searchParams.set('LinkUserId', current.currentUser.id);
    if (current.currentTenant.id)
      destination.searchParams.set('LinkTenantId', current.currentTenant.id);
    destination.searchParams.set('LinkToken', token);
    const returnUrl = new URL(path, native.location.origin);
    returnUrl.searchParams.set('handler', 'linkLogin');
    returnUrl.searchParams.set('linkUserId', current.currentUser.id);
    if (current.currentTenant.id)
      returnUrl.searchParams.set('linkTenantId', current.currentTenant.id);
    destination.searchParams.set('ReturnUrl', returnUrl.href);
    native.location.assign(destination.href);
  }
  async function prepareSourceLogin(intent: AccountLinkHandoff, own: number) {
    const sourceTenantId = intent.sourceTenantId ?? null;
    const domain = tenancy.domainTenant.value;
    if (domain && (domain.id ?? null) !== sourceTenantId)
      throw new AccountWorkflowError('Open the source tenant application before authenticating.');
    const context = identityContext();
    const found = sourceTenantId
      ? await tenants.findTenantByName(encodeURIComponent(intent.sourceTenantName ?? ''), {
          skipHandleError: true,
        })
      : null;
    if (own !== handoffRevision || auth.isAuthenticated.value || identityContext() !== context)
      throw new AccountWorkflowError(
        'The active account changed. Start the account operation again.',
      );
    if (sourceTenantId && (!found?.success || found.tenantId !== sourceTenantId))
      throw new AccountWorkflowError(
        'The source tenant is unavailable. Start the account operation again.',
      );
    session.setTenant(
      found ? { id: found.tenantId ?? null, name: found.name ?? null, isAvailable: true } : null,
    );
    await config.refreshAppState();
    if (
      own !== handoffRevision ||
      auth.isAuthenticated.value ||
      (session.getTenant()?.id ?? null) !== sourceTenantId ||
      (tenancy.domainTenant.value && (tenancy.domainTenant.value.id ?? null) !== sourceTenantId)
    )
      throw new AccountWorkflowError(
        'The active account changed. Start the account operation again.',
      );
    await auth.navigateToLogin(validReturnPath(), {
      prompt: 'login',
      ...(sourceTenantId ? { [tenantKey]: sourceTenantId } : {}),
    });
  }
  async function resumeHandoff(): Promise<boolean> {
    const own = ++handoffRevision;
    const native = nativeWindow();
    const fragment = new URLSearchParams(native.location.hash.slice(1));
    const raw = fragment.get('accountLinkHandoff');
    if (raw !== null) {
      if (activeIntent && !isConsumed(activeIntent)) consume(activeIntent);
      activeIntent = null;
      native.sessionStorage.removeItem(pendingKey);
      pending.value = null;
      fragment.delete('accountLinkHandoff');
      native.history.replaceState(
        native.history.state,
        '',
        `${native.location.pathname}${native.location.search}${fragment.size ? `#${fragment}` : ''}`,
      );
      const intent = parseAccountLinkHandoff(raw, options.trustedOrigins ?? []);
      if (!intent || isConsumed(intent))
        throw new AccountWorkflowError(
          'The linked account navigation intent is invalid, expired or already used.',
        );
      native.sessionStorage.setItem(pendingKey, JSON.stringify(intent));
    }
    const serialized = native.sessionStorage.getItem(pendingKey);
    if (!serialized) return false;
    const intent = parseAccountLinkHandoff(serialized, options.trustedOrigins ?? []);
    if (
      !intent ||
      isConsumed(intent) ||
      !trustedAccountOrigin(native.location.origin, options.trustedOrigins ?? [])
    ) {
      native.sessionStorage.removeItem(pendingKey);
      throw new AccountWorkflowError(
        'The linked account navigation intent is invalid, expired or untrusted.',
      );
    }
    activeIntent = intent;
    if (!auth.isAuthenticated.value) {
      const attempt = JSON.parse(serialized) as { loginAttempted?: unknown };
      if (attempt.loginAttempted === true) {
        native.sessionStorage.removeItem(pendingKey);
        consume(intent);
        throw new AccountWorkflowError(
          'Authentication was cancelled. Start the linked account navigation again.',
        );
      }
      native.sessionStorage.setItem(
        pendingKey,
        JSON.stringify({ ...intent, loginAttempted: true }),
      );
      await prepareSourceLogin(intent, own);
      return true;
    }
    native.sessionStorage.removeItem(pendingKey);
    const current = config.snapshot();
    if (
      current.currentUser.id !== intent.sourceUserId ||
      (current.currentTenant.id ?? null) !== (intent.sourceTenantId ?? null)
    ) {
      consume(intent);
      throw new AccountWorkflowError(
        'Authenticate the source account before completing this linked account navigation.',
      );
    }
    try {
      assertDestination(intent);
    } catch (cause) {
      consume(intent);
      throw cause;
    }
    const context = identityContext();
    const list = await link.getAllList({ skipHandleError: true });
    if (own !== handoffRevision)
      throw new AccountWorkflowError('The linked account navigation was cancelled.');
    assertContext(context);
    const target = matchingTarget(list.items ?? [], intent);
    if (!target) {
      consume(intent);
      throw new AccountWorkflowError('The selected account is no longer linked.');
    }
    pending.value = {
      intent,
      context,
      preview: {
        sourceUserName: current.currentUser.userName ?? '',
        sourceTenantName: current.currentTenant.name ?? null,
        target,
      },
    };
    return true;
  }
  async function confirmHandoff() {
    const own = handoffRevision;
    const selected = pending.value;
    if (
      !selected ||
      isConsumed(selected.intent) ||
      !parseAccountLinkHandoff(JSON.stringify(selected.intent), options.trustedOrigins ?? [])
    )
      throw new AccountWorkflowError(
        'Start the linked account navigation again before confirming.',
      );
    assertContext(selected.context);
    const list = await link.getAllList({ skipHandleError: true });
    if (own !== handoffRevision)
      throw new AccountWorkflowError('The linked account navigation was cancelled.');
    assertContext(selected.context);
    const target = matchingTarget(list.items ?? [], selected.intent);
    pending.value = null;
    nativeWindow().sessionStorage.removeItem(pendingKey);
    consume(selected.intent);
    activeIntent = null;
    assertDestination(selected.intent);
    if (!target) throw new AccountWorkflowError('The selected account is no longer linked.');
    await grant(
      'LinkLogin',
      {
        LinkUserId: target.targetUserId,
        ...(target.targetTenantId ? { LinkTenantId: target.targetTenantId } : {}),
      },
      {
        id: target.targetTenantId ?? null,
        name: target.targetTenantName ?? null,
        isAvailable: true,
      },
    );
  }
  return {
    beginLink,
    loginAs,
    resumeHandoff,
    confirmHandoff,
    cancelHandoff,
    pendingHandoff: computed(() => pending.value?.preview ?? null),
    switchTenant: (tenant: CurrentTenantDto | null) =>
      grant('SwitchTenant', tenant?.id ? { TenantId: tenant.id } : {}, tenant),
    returnToImpersonator: () => grant('Impersonation', {}),
    useDelegation: (id: string) => grant('Impersonation', { UserDelegationId: id }),
    impersonateUser: (userId: string, tenantId?: string | null) => {
      const targetTenant = tenantId === undefined ? config.snapshot().currentTenant.id : tenantId;
      return grant(
        'Impersonation',
        { UserId: userId, ...(targetTenant ? { TenantId: targetTenant } : {}) },
        { id: targetTenant ?? null, isAvailable: true },
      );
    },
  };
});
export type AccountWorkflowsService = ServiceOf<typeof AccountWorkflowsService>;
