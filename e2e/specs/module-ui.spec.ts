import { AccountService, ProfileService } from '@lsw-abpvue/account-core/proxy';
import { ExtensionsService } from '@lsw-abpvue/components';
import {
  ConfigStateService,
  createInjector,
  HTTP_INTERCEPTORS,
  provideAbpCore,
  runInInjectionContext,
  withOptions,
  type Environment,
  type HttpInterceptor,
  type Injector,
} from '@lsw-abpvue/core';
import {
  IdentityComponents,
  identityExtensionsResolver,
  DEFAULT_USERS_ENTITY_PROPS,
} from '@lsw-abpvue/identity';
import { IdentityRoleService, IdentityUserService } from '@lsw-abpvue/identity/proxy';
import {
  changesBetween,
  flatten,
  isGrantedElsewhere,
  toggle,
} from '@lsw-abpvue/permission-management';
import { PermissionsService } from '@lsw-abpvue/permission-management/proxy';
import { afterAll, describe, expect, it } from 'vitest';

const BACKEND = process.env.ABP_BACKEND_URL ?? 'https://localhost:44384';
const USERNAME = process.env.ABP_TEST_USERNAME ?? 'admin';
const PASSWORD = process.env.ABP_TEST_PASSWORD ?? '1q2w3E*';
const CLIENT_ID = process.env.ABP_TEST_CLIENT_ID ?? 'BookStore_App';
const SCOPE = process.env.ABP_TEST_SCOPE ?? 'offline_access BookStore';

// The backend serves a development certificate. Restored afterwards so nothing else in
// this worker inherits it.
const strictTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

afterAll(() => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = strictTls ?? '1';
});

async function accessToken(username: string, password: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${BACKEND}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username,
        password,
        scope: SCOPE,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return undefined;

    return ((await response.json()) as { access_token?: string }).access_token;
  } catch {
    return undefined;
  }
}

const token = await accessToken(USERNAME, PASSWORD);
if (!token) {
  // Rule 3 of the testing conventions: a test that has to authenticate has no fixture to
  // fall back on, so it says why it is not running and steps aside.
  console.info(
    `[modules] No ABP backend at ${BACKEND}; skipping the module tests.\n` +
      '  docker start abpvue-mongo && cd e2e/backend/BookStore/src/BookStore.HttpApi.Host && dotnet run',
  );
}

const environment: Environment = {
  apis: { default: { url: BACKEND } },
  application: { name: 'BookStore' },
  production: false,
};

function bearer(accessToken: string): HttpInterceptor {
  return (request, next) =>
    next({ ...request, headers: { Authorization: `Bearer ${accessToken}`, ...request.headers } });
}

/** An application with the configuration loaded, the way one is after startup. */
async function application(accessToken: string): Promise<Injector> {
  const injector = createInjector([
    provideAbpCore(withOptions({ environment })),
    { provide: HTTP_INTERCEPTORS, useFactory: () => bearer(accessToken), multi: true },
  ]);

  await injector.get(ConfigStateService).refreshAppState();

  return injector;
}

const unique = () => `m6-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Built here rather than in the suite: the configuration has to be loaded before
// anything reads it, and only the module's top level may await.
const injector = token ? await application(token) : (undefined as unknown as Injector);

describe.skipIf(!token)('the module pages against the backend they are for', () => {
  describe('identity, assembled the way a route entering the module assembles it', () => {
    it('puts the backend’s own extension properties on the users page', () => {
      runInInjectionContext(injector, () => identityExtensionsResolver());

      const columns = injector
        .get(ExtensionsService)
        .entityProps.get(IdentityComponents.Users)
        .props.toArray()
        .map(prop => prop.name);

      // What the module declares, and then what nobody wrote a line for.
      expect(columns).toEqual(
        expect.arrayContaining(DEFAULT_USERS_ENTITY_PROPS.map(prop => prop.name)),
      );
      expect(columns).toContain('SocialSecurityNumber');
      expect(columns).toContain('Age');
    });

    it('gives the create form the fields the backend says belong on it', () => {
      runInInjectionContext(injector, () => identityExtensionsResolver());

      const fields = injector
        .get(ExtensionsService)
        .createFormProps.get(IdentityComponents.Users)
        .props.toArray();

      expect(fields.map(field => field.name)).toContain('SocialSecurityNumber');
      // Declared invisible on the forms, and so not there to be filled in.
      expect(fields.map(field => field.name)).not.toContain('IsExternal');

      const required = fields.find(field => field.name === 'SocialSecurityNumber');
      const failed = required?.validators({ record: {}, getInjected: injector.get.bind(injector) });
      expect(failed?.length).toBeGreaterThan(0);
    });

    it('is idempotent: entering the module twice does not double the columns', () => {
      runInInjectionContext(injector, () => identityExtensionsResolver());
      const once = injector
        .get(ExtensionsService)
        .entityProps.get(IdentityComponents.Users)
        .props.toArray().length;

      runInInjectionContext(injector, () => identityExtensionsResolver());
      const twice = injector
        .get(ExtensionsService)
        .entityProps.get(IdentityComponents.Users)
        .props.toArray().length;

      expect(twice).toBe(once);
    });
  });

  describe('permission management, over what the backend actually grants', () => {
    const permissions = injector.get(PermissionsService);
    const roles = injector.get(IdentityRoleService);

    it('reads the grants of a role and sends back only what changed', async () => {
      const { items } = await roles.getAllList();
      const admin = items.find(role => role.name === 'admin');
      expect(admin?.name).toBeTruthy();

      const before = flatten((await permissions.get('R', admin?.name as string)).groups ?? []);
      expect(before.length).toBeGreaterThan(0);

      // A permission this provider itself grants, so the dialog may take it away again.
      const target = before.find(
        permission => permission.isGranted && !isGrantedElsewhere(permission, 'R'),
      );
      expect(target?.name).toBeTruthy();

      const revoked = toggle(before, target?.name as string);
      const changes = changesBetween(before, revoked);
      expect(changes.some(change => change.name === target?.name && !change.isGranted)).toBe(true);

      await permissions.update('R', admin?.name as string, { permissions: changes });

      const after = flatten((await permissions.get('R', admin?.name as string)).groups ?? []);
      expect(after.find(permission => permission.name === target?.name)?.isGranted).toBe(false);

      // Put it back, along with everything the revoke cascaded to.
      await permissions.update('R', admin?.name as string, {
        permissions: changesBetween(after, before),
      });

      const restored = flatten((await permissions.get('R', admin?.name as string)).groups ?? []);
      expect(restored.find(permission => permission.name === target?.name)?.isGranted).toBe(true);
    });

    it('marks a permission a role grants as one the user dialog cannot take away', async () => {
      const users = injector.get(IdentityUserService);
      const page = await users.getList({ maxResultCount: 1, skipCount: 0 });
      const admin = page.items[0];

      const granted = flatten(
        (await permissions.get('U', admin?.id as string)).groups ?? [],
      ).filter(permission => permission.isGranted);

      expect(granted.length).toBeGreaterThan(0);
      expect(granted.every(permission => isGrantedElsewhere(permission, 'U'))).toBe(true);
    });
  });

  describe('the account flow, end to end', () => {
    const account = injector.get(AccountService);
    const users = injector.get(IdentityUserService);

    it('registers, signs in, reads and edits the profile, and changes the password', async () => {
      const userName = unique();
      const password = '1q2w3E*';

      const registered = await account.register({
        userName,
        emailAddress: `${userName}@abp.io`,
        password,
        appName: 'Vue',
      });
      expect(registered.id).toBeTruthy();

      try {
        const theirToken = await accessToken(userName, password);
        expect(theirToken).toBeTruthy();

        const theirs = await application(theirToken as string);
        const profiles = theirs.get(ProfileService);

        const profile = await profiles.get();
        expect(profile.userName).toBe(userName);
        expect(profile.hasPassword).toBe(true);

        // The profile carries the user's object extensions, and the test backend
        // requires three of them -- which is why the personal settings form has fields
        // for them at all.
        const updated = await profiles.update({
          userName: profile.userName as string,
          email: profile.email as string,
          name: 'Milestone',
          surname: 'Six',
          concurrencyStamp: profile.concurrencyStamp as string,
          extraProperties: { SocialSecurityNumber: '123-45-6789', Age: 30, Title: 0 },
        });
        expect(updated.name).toBe('Milestone');

        const changed = '3E*2w1q';
        await profiles.changePassword({ currentPassword: password, newPassword: changed });

        expect(await accessToken(userName, password)).toBeUndefined();
        expect(await accessToken(userName, changed)).toBeTruthy();
      } finally {
        await users.delete(registered.id as string);
      }
    });

    it('refuses a password the tenant policy would not accept', async () => {
      const userName = unique();

      // ABP answers a rejected password with 403 and its own sentence rather than with a
      // validation error, so the client-side rules are what put it next to the field.
      await expect(
        account.register({
          userName,
          emailAddress: `${userName}@abp.io`,
          password: 'short',
          appName: 'Vue',
        }),
      ).rejects.toMatchObject({
        status: 403,
        error: { message: expect.stringContaining('Passwords must be at least') },
      });
    });
  });
});
