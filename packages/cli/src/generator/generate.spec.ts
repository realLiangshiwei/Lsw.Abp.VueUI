import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readApiDefinition, readApplicationConfiguration } from '../api-definition/source.js';
import type { ApiDefinition } from '../api-definition/models.js';
import type { ApplicationConfiguration } from '../api-definition/object-extensions.js';
import { DuplicatePathError, generateProxy, UnknownModuleError } from './generate.js';

const BACKEND = process.env.ABP_BACKEND_URL ?? 'https://localhost:44384';
const FIXTURE = resolve(import.meta.dirname, '../../../../e2e/fixtures/api-definition.json');
const CONFIGURATION_FIXTURE = resolve(
  import.meta.dirname,
  '../../../../e2e/fixtures/application-configuration.json',
);

async function withDevelopmentCertificate<T>(read: () => Promise<T>): Promise<T | undefined> {
  // The test backend serves a development certificate, which is what a person generating
  // a proxy on their own machine is talking to as well.
  const strict = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    return await read();
  } catch {
    return undefined;
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = strict ?? '1';
  }
}

async function live(): Promise<ApiDefinition | undefined> {
  return withDevelopmentCertificate(() => readApiDefinition({ url: BACKEND }));
}

const backend = await live();
if (!backend) {
  console.info(`[proxy] No ABP backend at ${BACKEND}; generating from the captured definition.`);
}

const definition = backend ?? (await readApiDefinition({ file: FIXTURE }));

const configuration =
  (backend &&
    (await withDevelopmentCertificate(() => readApplicationConfiguration({ url: BACKEND })))) ||
  ((await readApplicationConfiguration({
    file: CONFIGURATION_FIXTURE,
  })) as ApplicationConfiguration);

function generate(modules: string[], extras: Partial<Parameters<typeof generateProxy>[0]> = {}) {
  const result = generateProxy({ definition, modules, ...extras });

  return {
    ...result,
    content: (path: string) => result.files.find(file => file.path === path)?.content ?? '',
    paths: result.files.map(file => file.path),
  };
}

describe('generating the identity module', () => {
  const result = generate(['identity']);

  it('writes one service per controller, under the controller namespace', () => {
    expect(result.paths).toEqual(
      expect.arrayContaining([
        'volo/abp/identity/identity-user.service.ts',
        'volo/abp/identity/identity-role.service.ts',
        'volo/abp/identity/identity-user-lookup.service.ts',
        'volo/abp/identity/models.ts',
      ]),
    );
  });

  it('gives the service the module remote service name', () => {
    expect(result.content('volo/abp/identity/identity-user.service.ts')).toContain(
      "const apiName = 'AbpIdentity';",
    );
  });

  it('generates the five methods a CRUD page calls', () => {
    const service = result.content('volo/abp/identity/identity-user.service.ts');

    expect(service).toContain('get: (id: string, config?: RestConfig): Promise<IdentityUserDto>');
    expect(service).toContain('getList: (input: GetIdentityUsersInput');
    expect(service).toContain('create: (input: IdentityUserCreateDto');
    expect(service).toContain('update: (id: string, input: IdentityUserUpdateDto');
    expect(service).toContain('delete: (id: string, config?: RestConfig): Promise<void>');
  });

  it('takes the framework DTOs from core instead of generating them again', () => {
    expect(result.content('volo/abp/identity/models.ts')).toContain("from '@lsw-abpvue/core'");
    expect(result.paths).not.toContain('volo/abp/application/dtos/models.ts');
  });

  it('follows the type closure into other namespaces', () => {
    expect(result.paths).toContain('volo/abp/users/models.ts');
    expect(result.content('volo/abp/users/models.ts')).toContain('export interface UserData');
  });

  it('writes a barrel per directory, up to the root', () => {
    expect(result.content('index.ts')).toBe("export * from './volo/index.js';\n");
    expect(result.content('volo/abp/identity/index.ts')).toContain(
      "export * from './identity-user.service.js';",
    );
  });
});

describe('generating every module the backend describes', () => {
  const result = generate(['all']);

  it('covers the six open source modules', () => {
    const services = result.paths.filter(path => path.endsWith('.service.ts'));

    expect(services).toEqual(
      expect.arrayContaining([
        'pages/abp/multi-tenancy/abp-tenant.service.ts',
        'volo/abp/account/account.service.ts',
        'volo/abp/feature-management/features.service.ts',
        'volo/abp/identity/identity-user.service.ts',
        'volo/abp/permission-management/permissions.service.ts',
        'volo/abp/setting-management/email-settings.service.ts',
        'volo/abp/tenant-management/tenant.service.ts',
      ]),
    );
  });

  it('renames the second of two controllers that want one name', () => {
    expect(result.report.of('renamed')).toContain(
      'Volo.Abp.Account.Web.Areas.Account.Controllers.AccountController is generated as LoginService, because AccountService is taken.',
    );
  });

  it('resolves every type it meets', () => {
    expect(result.report.of('unresolved')).toEqual([]);
  });

  it('is idempotent, which is what refresh relies on', () => {
    expect(generate(['all']).files).toEqual(result.files);
  });
});

describe('asking for a module the backend does not have', () => {
  it('says which ones it does have', () => {
    expect(() => generate(['nope'])).toThrow(UnknownModuleError);
    expect(() => generate(['nope'])).toThrow(/identity/);
  });
});

describe('the object extension properties of the test backend', () => {
  const result = generate(['identity'], {
    objectExtensions: configuration.objectExtensions ?? { modules: {} },
  });
  const content = result.content('object-extension-validators.ts');

  it.each([
    [
      'SocialSecurityNumber',
      'Validators.required(), Validators.maxLength(64), Validators.minLength(4)',
    ],
    ['Age', 'Validators.required(), Validators.range(0, 150)'],
    ['IsExternal', 'Validators.required()'],
    ['Title', 'Validators.required()'],
    ['Website', 'Validators.pattern(new RegExp("^https?://.+"))'],
    ['InternalNote', 'Validators.maxLength(256)'],
  ])('%s gets the rules the backend declared for it', (name, rules) => {
    expect(content).toContain(`${name}: [${rules}],`);
  });

  it('leaves out HireDate, which declares no rules at all', () => {
    expect(content).not.toContain('HireDate');
  });

  it('generates the role property too, in its own map', () => {
    expect(content).toContain('export const identityRoleExtensionValidators = {');
    expect(content).toContain('Department: [Validators.maxLength(128)],');
  });

  it('is not affected by the permission InternalNote is behind', () => {
    expect(content).toContain('InternalNote: [Validators.maxLength(256)],');
  });
});

describe('a backend whose type names collide in the file system', () => {
  it('stops rather than letting one generated file overwrite another', () => {
    const colliding: ApiDefinition = {
      modules: {
        app: {
          rootPath: 'app',
          remoteServiceName: 'Default',
          controllers: {
            'Acme.BookController': {
              controllerName: 'Book',
              isRemoteService: true,
              isIntegrationService: false,
              type: 'Acme.BookController',
              actions: {
                GetAsync: {
                  uniqueName: 'GetAsync',
                  name: 'GetAsync',
                  httpMethod: 'GET',
                  url: 'api/app/book',
                  parametersOnMethod: [],
                  parameters: [],
                  returnValue: { type: 'Acme.AB', typeSimple: 'Acme.AB' },
                },
                GetOtherAsync: {
                  uniqueName: 'GetOtherAsync',
                  name: 'GetOtherAsync',
                  httpMethod: 'GET',
                  url: 'api/app/book/other',
                  parametersOnMethod: [],
                  parameters: [],
                  returnValue: { type: 'Acme.Ab', typeSimple: 'Acme.Ab' },
                },
              },
            },
          },
        },
      },
      // Two enums a case-insensitive file name cannot tell apart.
      types: {
        'Acme.AB': { isEnum: true, enumNames: ['One'], enumValues: [0] },
        'Acme.Ab': { isEnum: true, enumNames: ['Two'], enumValues: [0] },
      },
    };

    expect(() => generateProxy({ definition: colliding, modules: ['app'] })).toThrow(
      DuplicatePathError,
    );
  });
});
