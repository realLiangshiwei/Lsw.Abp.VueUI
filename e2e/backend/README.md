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
dotnet run --project src/BookStore.DbMigrator
dotnet run --project src/BookStore.HttpApi.Host
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
