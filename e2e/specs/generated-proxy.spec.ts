import { readFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createInjector,
  provideAbpCore,
  withOptions,
  HTTP_INTERCEPTORS,
  type Environment,
  type HttpInterceptor,
} from '@lsw-abpvue/core';
import { generateProxy, readApiDefinition, readApplicationConfiguration } from '@lsw-abpvue/cli';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdentityRoleService } from '../proxy/volo/abp/identity/identity-role.service.js';
import { IdentityUserService } from '../proxy/volo/abp/identity/identity-user.service.js';
import { TenantService } from '../proxy/volo/abp/tenant-management/tenant.service.js';
import { PermissionsService } from '../proxy/volo/abp/permission-management/permissions.service.js';
import { FeaturesService } from '../proxy/volo/abp/feature-management/features.service.js';
import { EmailSettingsService } from '../proxy/volo/abp/setting-management/email-settings.service.js';
import { ProfileService } from '../proxy/volo/abp/account/profile.service.js';
import { AbpTenantService } from '../proxy/pages/abp/multi-tenancy/abp-tenant.service.js';
import { FileService } from '../proxy/book-store/files/file.service.js';
import { BookService } from '../proxy/book-store/books/book.service.js';
import { BookStorePolicyNames } from '../proxy/policy-names.js';

const BACKEND = process.env.ABP_BACKEND_URL ?? 'https://localhost:44384';
const USERNAME = process.env.ABP_TEST_USERNAME ?? 'admin';
const PASSWORD = process.env.ABP_TEST_PASSWORD ?? '1q2w3E*';
const CLIENT_ID = process.env.ABP_TEST_CLIENT_ID ?? 'BookStore_App';

const PROXY = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'proxy');

// The backend serves a development certificate, which is what the generator's --insecure
// is for as well. Restored afterwards so nothing else in this worker inherits it.
const strictTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

afterAll(() => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = strictTls ?? '1';
});

async function accessToken(): Promise<string | undefined> {
  try {
    const response = await fetch(`${BACKEND}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: USERNAME,
        password: PASSWORD,
        scope: 'offline_access BookStore',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return undefined;

    return ((await response.json()) as { access_token?: string }).access_token;
  } catch {
    return undefined;
  }
}

const token = await accessToken();
if (!token) {
  // Rule 3 of the testing conventions: a test that has to authenticate has no fixture to
  // fall back on, so it says why it is not running and steps aside.
  console.info(
    `[proxy] No ABP backend at ${BACKEND}; skipping the tests that call one.\n` +
      '  docker start abpvue-mongo && cd e2e/backend/BookStore/src/BookStore.HttpApi.Host && dotnet run',
  );
}

const environment: Environment = {
  apis: { default: { url: BACKEND } },
  application: { name: 'BookStore' },
  production: false,
};

function bearer(): HttpInterceptor {
  return (request, next) =>
    next({ ...request, headers: { Authorization: `Bearer ${token}`, ...request.headers } });
}

function application() {
  return createInjector([
    provideAbpCore(withOptions({ environment })),
    { provide: HTTP_INTERCEPTORS, useFactory: bearer, multi: true },
  ]);
}

describe.skipIf(!token)('what the generated proxy does against the backend it came from', () => {
  const injector = application();

  describe('books', () => {
    const books = injector.get(BookService);
    const filter = `book-${Date.now()}`;
    const ids: string[] = [];
    const names = ['A', 'B', 'C'].map(suffix => `${filter}-${suffix}`);

    beforeAll(async () => {
      for (const [index, name] of names.entries()) {
        const created = await books.create({
          name,
          type: 8,
          publishDate: ['2020-01-01', '2022-01-01', '2021-01-01'][index] as string,
          price: [20, 10, 30][index] as number,
          extraProperties: { Isbn: `${filter}-${index}` },
        });
        if (created.id) ids.push(created.id);
      }
    });

    afterAll(async () => {
      for (const id of ids) await books.delete(id);
    });

    it.each([
      ['name asc', [0, 1, 2]],
      ['name desc', [2, 1, 0]],
      ['price asc', [1, 0, 2]],
      ['price desc', [2, 0, 1]],
      ['publishDate asc', [0, 2, 1]],
      ['publishDate desc', [1, 2, 0]],
    ] as const)('sorts by %s before paging', async (sorting, order) => {
      const page = await books.getList({ filter, sorting, skipCount: 1, maxResultCount: 2 });

      expect(page.totalCount).toBe(3);
      expect(page.items.map(book => book.name)).toEqual(order.slice(1).map(index => names[index]));
    });

    it('keeps an object extension when a book is read and updated', async () => {
      const id = ids[0] as string;
      const read = await books.get(id);
      expect(read.extraProperties?.Isbn).toBe(`${filter}-0`);

      const updated = await books.update(id, {
        name: read.name as string,
        type: read.type,
        publishDate: read.publishDate,
        price: read.price,
        extraProperties: { ...read.extraProperties, Isbn: `${filter}-updated` },
      });

      expect(updated.extraProperties?.Isbn).toBe(`${filter}-updated`);
      expect(updated.publishDate).toBe(read.publishDate);
    });

    it('refuses book reads and writes without authentication', async () => {
      const anonymous = createInjector([provideAbpCore(withOptions({ environment }))]).get(
        BookService,
      );

      await expect(anonymous.getList({ maxResultCount: 1 })).rejects.toMatchObject({ status: 401 });
      await expect(
        anonymous.create({
          name: `${filter}-anonymous`,
          type: 8,
          publishDate: '2026-10-02',
          price: 1,
        }),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('removes only the book addressed by its id', async () => {
      const created = await books.create({
        name: `${filter}-delete`,
        type: 8,
        publishDate: '2026-10-02',
        price: 1,
      });
      const id = created.id as string;
      ids.push(id);
      await books.delete(id);
      ids.splice(ids.indexOf(id), 1);

      await expect(books.get(id)).rejects.toThrow();
      expect((await books.getList({ filter, maxResultCount: 10 })).totalCount).toBe(3);
    });
  });

  describe('identity', () => {
    const users = injector.get(IdentityUserService);
    const roles = injector.get(IdentityRoleService);
    let createdId: string | undefined;

    it('lists users, paged the way the input says', async () => {
      const page = await users.getList({ maxResultCount: 1, skipCount: 0 });

      expect(page.totalCount).toBeGreaterThan(0);
      expect(page.items).toHaveLength(1);
    });

    it('creates, reads, updates and deletes one', async () => {
      // The test backend declares four object extension properties as required, and
      // `extraProperties` is where a generated DTO carries them.
      const extras = {
        SocialSecurityNumber: '123-45-6789',
        Age: 30,
        IsExternal: false,
        Title: 0,
      };

      const created = await users.create({
        userName: `proxy-test-${Date.now()}`,
        email: `proxy-test-${Date.now()}@abp.io`,
        password: '1q2w3E*',
        roleNames: [],
        extraProperties: extras,
      });
      createdId = created.id;

      expect(created.id).toBeTruthy();

      const read = await users.get(created.id as string);
      expect(read.userName).toBe(created.userName);

      const updated = await users.update(created.id as string, {
        userName: created.userName as string,
        email: created.email as string,
        surname: 'Generated',
        concurrencyStamp: read.concurrencyStamp as string,
        // Sent again rather than echoed back from the read: the backend does not return
        // an extension property whose value is `false`, and `IsExternal` is required.
        extraProperties: { ...extras, ...read.extraProperties },
      });
      expect(updated.surname).toBe('Generated');

      await users.delete(created.id as string);
      createdId = undefined;

      await expect(users.get(created.id as string)).rejects.toThrow();
    });

    afterAll(async () => {
      if (createdId) await users.delete(createdId).catch(() => undefined);
    });

    it('reads a list result, which is a different envelope from a paged one', async () => {
      const assignable = await users.getAssignableRoles();

      expect(Array.isArray(assignable.items)).toBe(true);
    });

    it('reaches the roles of the same module', async () => {
      const page = await roles.getList({ maxResultCount: 10, skipCount: 0 });

      expect(page.items.map(role => role.name)).toContain('admin');
    });
  });

  describe('a file', () => {
    const files = injector.get(FileService);
    const name = `proxy-test-${Date.now()}.txt`;

    it('goes up as multipart and comes back as a blob', async () => {
      const form = new FormData();
      form.append(
        'file',
        new Blob(['generated proxies carry files too'], { type: 'text/plain' }),
        name,
      );

      const uploaded = await files.upload(form);
      expect(uploaded.name).toBe(name);
      expect(uploaded.size).toBeGreaterThan(0);

      const listed = await files.getList();
      expect(listed.items.map(file => file.name)).toContain(name);

      const downloaded = await files.getContent(name);
      expect(downloaded).toBeInstanceOf(Blob);
      await expect(downloaded.text()).resolves.toBe('generated proxies carry files too');
    });
  });

  describe('the other modules', () => {
    it('tenant management answers a paged list', async () => {
      const page = await injector.get(TenantService).getList({ maxResultCount: 10, skipCount: 0 });

      expect(page.totalCount).toBeGreaterThanOrEqual(0);
    });

    it('permission management answers the groups of a provider', async () => {
      const permissions = await injector.get(PermissionsService).get('R', 'admin');

      expect(permissions.groups?.length).toBeGreaterThan(0);
    });

    it('feature management answers the groups of a provider', async () => {
      const features = await injector.get(FeaturesService).get('T', '');

      expect(Array.isArray(features.groups)).toBe(true);
    });

    it('setting management answers the email settings', async () => {
      const settings = await injector.get(EmailSettingsService).get();

      expect(settings).toBeTypeOf('object');
    });

    it('account answers the profile of the signed in user', async () => {
      const profile = await injector.get(ProfileService).get();

      expect(profile.userName).toBe(USERNAME);
    });

    it('the framework endpoint answers a tenant lookup, anonymous', async () => {
      const result = await injector.get(AbpTenantService).findTenantByName('nothing-by-this-name');

      expect(result.success).toBe(false);
    });
  });
});

describe('the permission names', () => {
  it('are read off the actions of an application service that authorizes', () => {
    expect(BookStorePolicyNames.Files).toBe('BookStore.Files');
    expect(BookStorePolicyNames.FilesUpload).toBe('BookStore.Files.Upload');
  });
});

describe('the proxy that is checked in', () => {
  it('is what the generator produces from this backend today', async () => {
    if (!token) return;

    const definition = await readApiDefinition({ url: BACKEND });
    const configuration = await readApplicationConfiguration({ url: BACKEND, token });
    const result = generateProxy({
      definition,
      modules: ['all'],
      objectExtensions: configuration.objectExtensions,
      grantedPolicies: Object.entries(configuration.auth?.grantedPolicies ?? {})
        .filter(([, granted]) => granted)
        .map(([name]) => name),
    });

    for (const file of result.files) {
      const path = join(PROXY, file.path);
      const options = await resolveConfig(path);
      // The files on disk went through Prettier on the way there, which is what the
      // command does; comparing before that would be comparing formatters.
      const expected = await format(file.content, { ...options, filepath: path });

      expect(await readFile(path, 'utf8'), file.path).toBe(expected);
    }
  });
});
