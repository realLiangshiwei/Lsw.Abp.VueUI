import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readApiDefinition } from '../api-definition/source.js';
import type { ApiDefinition } from '../api-definition/models.js';
import { generateProxy, UnknownModuleError } from './generate.js';

const BACKEND = process.env.ABP_BACKEND_URL ?? 'https://localhost:44384';
const FIXTURE = resolve(import.meta.dirname, '../../../../e2e/fixtures/api-definition.json');

async function live(): Promise<ApiDefinition | undefined> {
  // The test backend serves a development certificate, which is what a person generating
  // a proxy on their own machine is talking to as well.
  const strict = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    return await readApiDefinition({ url: BACKEND });
  } catch {
    return undefined;
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = strict ?? '1';
  }
}

const backend = await live();
if (!backend) {
  console.info(`[proxy] No ABP backend at ${BACKEND}; generating from the captured definition.`);
}

const definition = backend ?? (await readApiDefinition({ file: FIXTURE }));

function generate(modules: string[]) {
  const result = generateProxy({ definition, modules });

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
