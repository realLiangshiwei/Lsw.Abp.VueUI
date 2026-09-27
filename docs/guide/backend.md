# Talking to the backend

Every request goes through `RestService`, which puts the tenant header, the access token
and the culture on it and hands failures to the error handlers. You rarely call it
directly: the proxy generator writes typed services on top of it.

## Generating the services

```bash
abpv proxy add --module identity     # one module, several, or "all"
abpv proxy refresh                   # generate again what is recorded
abpv proxy remove --module identity  # take one out, generate the rest again
```

From `/api/abp/api-definition`, into `src/proxy`:

```
src/proxy/
├── generate-proxy.json                what was generated, and with which options
├── index.ts                           a barrel per directory
├── policy-names.ts                    the permission names, as constants
├── object-extension-validators.ts     the rules of the object extension properties
└── volo/abp/identity/
    ├── models.ts                      the DTOs, as interfaces
    ├── validators.ts                  the rules the DTOs declare
    ├── identity-user.service.ts
    └── identity-role.service.ts
```

Check the directory in. A change in it in a pull request is a change in the backend's
API, and that is worth seeing.

## Using one

```ts
import { inject } from '@lsw-abpvue/core';
import { IdentityUserService } from '../proxy/volo/abp/identity';

const users = inject(IdentityUserService);
const page = await users.getList({ maxResultCount: 10, skipCount: 0 });
```

A generated service is an ordinary service: `defineService`, one method per endpoint,
each returning a promise. Nothing about it is special-cased by the framework, so a
hand-written service and a generated one are used the same way.

## Validators from the backend

The backend already says how long a name may be. Both places it says so end up in the
proxy: the data annotations `api-definition` reports per DTO property, and the attributes
on an object extension property, which only `application-configuration` knows about.

```ts
const form = useAbpForm({
  userName: { value: '', validators: identityUserCreateOrUpdateDtoBaseValidators.userName },
  socialSecurityNumber: {
    value: '',
    validators: identityUserExtensionValidators.SocialSecurityNumber,
  },
});
```

The maps are sparse on purpose: a rule the backend enforces in code rather than in an
attribute is not there, and a rule a DTO inherits stays in the map of the type that
declares it — so a form editing a derived DTO spreads the two together.

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
`[Authorize]` — true for an application service exposed as a conventional controller, not
for the HTTP API controllers of ABP's own modules, which authorize in the application
service behind them. Pass `--token` and the names are read from
`application-configuration` as well, which is what makes them complete for those modules.

## Requests you write yourself

```ts
const rest = inject(RestService);

const report = await rest.request<never, ReportDto>(
  { method: 'GET', url: '/api/app/report', params: { year: 2026 } },
  { apiName: 'Default' },
);
```

`apiName` picks which entry of `apis` in the configuration the request goes to, which is
how a module on its own host is reached. `skipAuthorization` leaves the bearer token off
while keeping the tenant header — what a call to the token endpoint needs.

REST requests also carry `X-Requested-With: XMLHttpRequest`. ABP's cookie authentication
uses it to return 401 or 403 for an API failure instead of redirecting to an HTML login
page. An explicit header of the same name takes precedence, regardless of casing.

For an external API that should not receive the framework's headers, pass
`skipAddingHeader: true`. This leaves off the AJAX, tenant, language and timezone headers;
use `skipAuthorization: true` as well when that API should not receive the bearer token.

## When the proxy goes stale

```bash
abpv doctor
```

Among its checks is whether the proxy on disk is what the backend describes today: the
generation is run again in memory and compared file by file, so nothing has to have been
recorded for it to work. `abpv proxy refresh` brings it back.
