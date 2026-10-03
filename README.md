# Lsw.Abp.VueUI

An unofficial Vue UI for the ABP Framework, released under the [MIT License](LICENSE).
It uses the framework's existing endpoints and keeps Angular UI component keys,
localization keys, DTO fields and permission names compatible.

Packages use the `@lsw-abpvue/*` scope. The implementation uses Vue 3, TypeScript and
Vue Router; applications can replace the theme and extend module pages.

## Alpha

The first alpha candidate is `0.0.1-alpha.0` across all fourteen public packages.
Use the `alpha` tag when trying the CLI:

```bash
npx @lsw-abpvue/cli@alpha new Acme.BookStore -d mongodb --sample-crud
```

Follow [the new solution guide](docs/guide/new-solution.md) for backend setup, or
[the existing solution guide](docs/guide/existing-solution.md) to add Vue to a backend.

## Run the playground

Use Node 24 (the CI version), pnpm 11.22.0, the .NET 10 SDK, Docker and the official ABP
CLI. The workspace pins TypeScript to 6.0.3.

From the repository root:

```bash
pnpm install --frozen-lockfile
```

Start and seed the test backend by following [the backend setup](e2e/backend/README.md).
That includes MongoDB, `abp install-libs`, and running the migrator from its own project
directory. Trust the local HTTPS development certificate with
`dotnet dev-certs https --trust` if it has not been trusted yet.

Then, in another terminal at the repository root:

```bash
pnpm --filter playground dev
```

Open <http://localhost:4200/account/login> and sign in with `admin` / `1q2w3E*`.
The Books page exercises a generated CRUD page and a backend-defined ISBN extension.
The backend's Swagger UI is at <https://localhost:44384/swagger>.

## Documentation

```bash
pnpm --filter @lsw-abpvue/docs dev
```

The [documentation index](docs/index.md) links to setup, configuration, extension points,
the CLI and the [Angular migration guide](docs/migration/from-angular.md).

Documentation CI builds the site independently of deployment. GitHub Pages deployment
is opt-in through the repository variable `DOCS_PAGES_ENABLED=true`, with Pages configured
to use GitHub Actions. The current private repository's GitHub plan does not support
Pages, so deployment remains disabled until the repository becomes eligible.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm size
```

Framework contract tests cover captured ABP 10.5.0 and 10.6.0 responses even when the
backend is unavailable. Tests needing authentication report why they are skipped.
With the test backend running, the generated service and module tests use its real API.

Size budgets measure each package's own code with shared framework and UI dependencies
excluded. The basic theme's budget is 12.5 kB after replacing its native date input with
the calendar and segmented date/time fields; the pure object-extension mapping entry has
a separate 1 kB budget.
