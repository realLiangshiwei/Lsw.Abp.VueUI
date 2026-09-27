# Test backend

An open source ABP solution the tests run against. MongoDB, no UI.

Generated with:

```bash
abp new BookStore -t app -u no-ui -uost -d mongodb -csf
```

`-uost` forces the open source template. Without it a machine with a commercial
subscription produces the commercial variant. Keep it on any regeneration.

## Run it

```bash
docker run -d --name abpvue-mongo -p 27017:27017 --restart unless-stopped mongo:8

cd BookStore
abp install-libs
cd src/BookStore.DbMigrator
dotnet run
cd ../BookStore.HttpApi.Host
dotnet run
```

Swagger is at <https://localhost:44384/swagger>. Admin user is `admin` / `1q2w3E*`.

Two things that will bite you:

- `dotnet run --project X` keeps the current directory, so `appsettings.json` is not
  picked up and the connection string resolves to null. Run from inside the project
  directory, or pass `ConnectionStrings__Default` as an environment variable.
- Skipping `abp install-libs` makes every request return a 500 page complaining about a
  missing libs folder. `wwwroot/libs` is gitignored, so this is needed after a fresh clone.

## Endpoints the tests use

| Endpoint | Used by |
| --- | --- |
| `/api/abp/application-configuration?includeLocalizationResources=false` | configuration state, permissions, settings, features, object extension mapping |
| `/api/abp/application-localization?cultureName=en&onlyDynamics=false` | localization |
| `/api/abp/api-definition?includeTypes=true` | proxy generator |
| `/connect/token` | authentication |
| module endpoints under `/api/identity`, `/api/multi-tenancy`, ... | the module UIs |

`includeTypes=true` is not optional. Without it the type pool comes back empty.

## The Book entity

`src/BookStore.Application/Books` is what the CRUD page generator is measured against: the
same shape as the entity in ABP's own BookStore tutorial, so the generated page can be
compared with the React template's hand-written one. It is written out rather than
inherited from `CrudAppService` -- the shape of the API is what the generator reads, and
writing it out keeps that shape in one file.

`ObjectExtensions` declares one property on it, `Isbn`. A generated page has to show it as
a column without being generated again, which is the whole claim of the extension system
and now has something to check it against.

The migrator loads the application contracts, including the application's permission
definitions. ABP's `PermissionDataSeedContributor` grants those permissions to the admin
role on each seed run, including permissions added after the role was created. After
adding a permission, run the migrator again and restart the host to refresh its permission
cache. This was checked against a separate database with an existing admin role.

## Fixtures

`../fixtures` holds captured responses for the three framework endpoints. Tests use the
live backend when it is reachable and fall back to these otherwise, which is what CI runs
on.

Refresh them after upgrading ABP or changing the object extensions:

```bash
./scripts/capture-fixtures.sh
```

A scheduled CI job runs the same script against a live backend and fails on a diff, so the
fixtures cannot drift silently.

### The contract matrix

The contract tests run against every captured backend: `../fixtures` itself, plus any
subdirectory of it that has an `api-definition.json` in it. The directory name is the
version that row reports, so a second ABP version is one command:

```bash
ABP_BACKEND_URL=https://localhost:44385 ./scripts/capture-fixtures.sh --into e2e/fixtures/10.5.0
```

The matrix covers ABP 10.5.0 and 10.6.0. Both sets were captured from running backends;
the [10.5.0 capture notes](../fixtures/10.5.0/README.md) explain how to reproduce the older
host with matching dependencies. `abpv doctor` reports both tested minor versions.

## The spec that needs the official CLI

`specs/abp-new.spec.ts` answers the M8 stop-loss question -- whether wrapping `abp new`
leaves what it produces alone -- by generating the same solution twice, once through each
CLI, and comparing them. It is off by default because it needs the .NET SDK, the ABP CLI
and a template download from get.abp.io:

```bash
ABPVUE_E2E_ABP=1 pnpm test
```

Two runs of the same `abp new` differ in 23 files on their own -- project ids, creation
times, ports, two passphrases -- so the comparison normalises those first. What is left
should be the two `appsettings.json` `abpv new` is meant to change, and nothing else.

## Object extensions

`BookStoreModuleExtensionConfigurator` adds nine extra properties, to the identity user
and role and to the tenant. They are there for coverage, not realism: each one exercises a
different branch of the objectExtensions mapping.

| Property | Type | Table | Create | Edit | Notes |
| --- | --- | --- | --- | --- | --- |
| SocialSecurityNumber | string | yes | yes | yes | Required, StringLength(4..64) |
| Age | number | yes | yes | yes | Range(0..150) |
| IsExternal | boolean | yes | no | no | table only |
| HireDate | datetime | no | yes | yes | forms only |
| Title | enum | yes | yes | yes | BookStore.EmployeeTitle |
| Website | string | no | no | yes | RegularExpression, edit only |
| InternalNote | string | no | yes | yes | requires AbpIdentity.Users.Update |
| Role.Department | string | yes | yes | yes | StringLength(128) |
| Tenant.ContactEmail | string | yes | yes | yes | EmailAddress, StringLength(256), another module |

Adding a case to the mapping tests means adding a property here and refreshing the fixtures.
