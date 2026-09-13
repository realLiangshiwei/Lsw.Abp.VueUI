# @lsw-abpvue/cli

The command line tool of [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI), an
**unofficial** Vue UI for the [ABP Framework](https://abp.io). Today it generates typed
proxies from a running backend; the project scaffolding commands land later.

```bash
npx @lsw-abpvue/cli proxy add --module identity
```

Both `abpvue` and `abpv` run it.

## What it writes

```bash
abpv proxy add --module identity     # generate one module, or several, or "all"
abpv proxy refresh                   # generate again what is recorded
abpv proxy remove --module identity  # take one out, generate the rest again
```

Into `src/proxy`, from `/api/abp/api-definition`:

```
src/proxy/
├── generate-proxy.json                     what was generated, and with which options
├── index.ts                                a barrel per directory
├── policy-names.ts                         the permission names, as constants
├── object-extension-validators.ts          the rules of the object extension properties
└── volo/abp/identity/
    ├── models.ts                           the DTOs, as interfaces
    ├── validators.ts                       the rules the DTOs declare
    ├── identity-user.service.ts
    └── identity-role.service.ts
```

Check the directory in. A change in it in a pull request is a change in the backend's API.

## A generated service

```ts
export const IdentityUserService = defineService('IdentityUserService', () => {
  const rest = inject(RestService);
  const apiName = 'AbpIdentity';

  return {
    apiName,

    get: (id: string, config?: RestConfig): Promise<IdentityUserDto> =>
      rest.request<never, IdentityUserDto>(
        { method: 'GET', url: `/api/identity/users/${id}` },
        { apiName, ...config },
      ),
  };
});
```

Used the way any service is:

```ts
const users = inject(IdentityUserService);
const page = await users.getList({ maxResultCount: 10, skipCount: 0 });
```

## Validators

The backend already says how long a name may be. Both places it says so end up here: the
data annotations `api-definition` reports per DTO property, and the attributes on an
object extension property, which only `application-configuration` knows about.

```ts
const form = useAbpForm({
  userName: { value: '', validators: identityUserCreateOrUpdateDtoBaseValidators.userName },
  socialSecurityNumber: { value: '', validators: identityUserExtensionValidators.SocialSecurityNumber },
});
```

The maps are sparse: a rule the backend enforces in code rather than in an attribute is
not there, and a rule a DTO inherits stays in the map of the type that declares it.

Turn them off with `--no-validators`.

## Permission names

```ts
if (permission.isGranted(AbpIdentityPolicyNames.UsersCreate)) ...
```

Merge the generated union into core once, anywhere in the application, and a misspelled
permission stops compiling instead of quietly answering no:

```ts
declare module '@lsw-abpvue/core' {
  interface AbpKnownPolicyName extends Record<AbpIdentityPolicyName, true> {}
}
```

Merging nothing is a supported state: until something is merged in, `isGranted` takes any
string.

ABP fills in an endpoint's authorization only when the controller itself carries
`[Authorize]`, which is the case for an application service exposed as a conventional
controller but not for the HTTP API controllers of ABP's own modules -- they authorize in
the application service behind them. Pass `--token` and the names are read from
`application-configuration` as well, which is what makes them complete for those modules.

## Options

| | |
| --- | --- |
| `--module <name>` | Comma separated, or `all` |
| `--target <dir>` | Default `src/proxy` |
| `--url <backend>` | Default: `public/dynamic-env.json`, then `VITE_API_URL` |
| `--source <file>` | A saved `api-definition.json`, for working offline |
| `--config-source <file>` | A saved `application-configuration.json`, alongside `--source` |
| `--token <token>` | For a backend that does not answer anonymously, and for the permission names |
| `--insecure` | Accept the development certificate a local ABP backend serves |
| `--service-type <t>` | `application` (default), `integration`, `all` |
| `--root-namespace <ns>` | Taken off the front of the generated directories |
| `--api-name <name>` | Overrides the module's remote service name |
| `--no-index` | No barrel files |
| `--no-validators` / `--no-policy-names` | Leave those out |
| `--dry-run` | Say what would change and write nothing |

## Compared with Angular

`@abp/ng.schematics`'s `generate-proxy` is the same idea and the same algorithm. What
differs:

| Angular | Here |
| --- | --- |
| A method returns an `Observable` | It returns a `Promise` |
| `@Injectable()` class | `defineService`, injected the same way |
| Types only | Also the validators and the permission names |
| Barrels are namespace objects | Flat `export *`; names are made unique across the whole generation |
| Extensionless relative imports | `./models.js`, which resolves under `node16` too |
| Reads the backend URL from `environment.ts` | From `dynamic-env.json` or `VITE_API_URL` |

The differences are registered in the design documents' `api-parity-map.md`.

## Programmatic use

The generator is a pure function: it answers with a list of files and writes nothing, so
a build of your own can do what it likes with them.

```ts
import { generateProxy, readApiDefinition } from '@lsw-abpvue/cli';

const definition = await readApiDefinition({ url: 'https://localhost:44384' });
const { files, report } = generateProxy({ definition, modules: ['identity'] });
```

## License

MIT.
