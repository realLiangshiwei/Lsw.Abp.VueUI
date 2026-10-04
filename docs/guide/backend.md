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

## Regenerate after an API change

1. Change and run the backend first. Confirm api-definition contains the intended module/controller, verbs, route parameters and DTO properties.
2. From vue/, run `pnpm abpv proxy refresh` using the recorded configuration. Use `proxy add --module app` when registering a new module for the first time.
3. Review the generated diff. Compile errors identify changed consumers; do not patch generated methods just to restore an old contract.
4. Adapt pages and validators, then typecheck and exercise the real endpoint.
5. Commit the reviewed proxy metadata and generated output with the backend-compatible application change.

Proxy output is reproducible input to your business page. Keep custom service helpers outside it. A method's types describe transport shape; they do not enforce runtime business validation.

## Find the right generated import

Look at the generated namespace directories and barrel exports rather than guessing the service name. Root-namespace removal changes paths, and collisions can rename DTOs. The generate command replays the recorded proxy options to resolve these names; moving proxy files independently can break that relationship.

Use the generated service's final optional RestConfig to pass signal or a named API override. Resolve the service in setup, then retain that reference for click handlers. A service factory itself should not make a request merely because it was injected.

## Offline and protected definitions

Save an authorized api-definition response and, when available, the same session's application-configuration response. Generate using --source and --config-source as described in [proxy](/cli/proxy). Without authenticated policy metadata, some permission names cannot be completed; doctor reports that limitation rather than claiming an empty set is a match.

Do not commit access tokens into proxy metadata or command examples. The generated code references framework services, not credentials. If a module lives on another host, its apiName must match the named apis configuration in [configuration](/guide/configuration).

## Inspect the generated directory

For a BookStore API using the `BookStore.Books` namespace, removing the `BookStore` root namespace produces this directory:

```bash
pnpm abpv proxy add --module app --root-namespace BookStore --target src/proxy
```

```text
src/proxy/
├── books/
│   ├── book.service.ts
│   ├── models.ts
│   ├── book-type.enum.ts
│   ├── validators.ts
│   └── index.ts
├── policy-names.ts
├── index.ts
└── generate-proxy.json
```

Use your actual root namespace (for example Acme.BookStore), module and output directory. A different backend produces different folders and DTO members. The root setting shortens namespace directories; it does not change the endpoint URLs. The generated service still uses the module's apiName, so configure a named API when the service lives on a separate host.

## Consume enums and validator maps

The complete consumer below uses a Book API whose create DTO has name, type, publishDate and price. Its generated files are captured from the repository's running BookStore test backend. An optional Authors/Books solution also requires authorId; keep all fields declared by your own generated create DTO.

Sign in with the Books read/create policies required by your application service. For the repository backend these are `BookStore.Books` and `BookStore.Books.Create`.

Create `src/pages/BookForm.vue` and change the `./generated/books` import to `../proxy/books` after generating that namespace:

<<< ../examples/ProxyBookForm.vue

Numeric enum values are sent to the API; labels come from bookTypeOptions and localized enum keys. The map is generated from metadata, not manually copied values. Add the enum texts to your resource, or the fallback enum names remain visible.

Spread each generated validator array before adding application rules. The example adds a stricter price maximum of 500 while retaining backend-required/range rules. Regeneration updates the shared map without overwriting the page's added rule. For inherited DTOs, combine the maps of the declaring types explicitly.

The date control returns a date string. This backend accepts the publication date as DateTime; it represents a calendar publication date, not an arbitrary user-local instant. Price/enum values remain numbers, and required nullable controls are narrowed before constructing the typed DTO. [Date semantics](/utilities/dates) explains choosing a different model for appointments or event timestamps.

Use generated methods in setup-created service references, with request config as the last argument. Do not inject after await. The failed request leaves the form intact and routes server validation to controls; an actual backend round trip still checks rules not expressed in annotations.

## Refresh without losing application code

After changing a DTO or enum, run proxy refresh and inspect the diff. The page imports the same public generated indexes until namespaces/methods change; resulting type errors identify consumers that need updating. Do not patch a generated DTO to hide an API mismatch. For example, removing an enum member requires updating stored values and UI choices as well as regenerating the enum.

Keep business helper functions, field labels, custom validators and page code outside src/proxy. Review and commit the generation record together with generated output. A dry run or doctor check can show drift, but cannot prove the API saves data correctly.
