# API proxies

Generated services give your business API typed methods and DTOs. They use `RestService`, so framework authentication, tenant and language handling is shared.

## Application services

Run from `vue/` with the backend available:

```bash
pnpm abpv proxy add --module app
pnpm abpv proxy refresh
```

The generator reads `/api/abp/api-definition`; application configuration supplies additional object-extension and policy metadata. An untrusted local certificate can be accepted with `--insecure` for development. Offline input is supported by `--source` and `--config-source`.

Output goes to `src/proxy` by default, with services, DTOs, supported validators, policy constants and `generate-proxy.json`. Import the actual names and paths generated for your backend, and commit the output so API changes can be reviewed.

## Built-in module proxies

Built-in module services already ship in package `/proxy` entry points:

```ts
import { inject } from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity/proxy';

const users = inject(IdentityUserService);
const page = await users.getList({ maxResultCount: 10, skipCount: 0 });
```

This fragment runs in setup or a provider factory. Capture the service before an async callback. Generate a local copy of a built-in proxy only when you intentionally need to maintain it separately.

## Validators and policies

Validator maps reflect supported DTO annotations, not every business rule. Compose inherited DTO maps where needed. Policy constants use the backend's names; authenticated configuration can complete names absent from API metadata. Frontend checks do not replace backend authorization.

Generated service methods return promises and accept request configuration. Pass a cancellation signal for obsolete work. For hand-written calls and error options, see [HTTP](/core/http). `abpv doctor` compares generated files with the current backend definition, and `proxy refresh` recreates them.
