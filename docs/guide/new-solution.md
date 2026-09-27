# A new solution

One command creates both halves: the backend by the official ABP CLI, the frontend by
this one.

```bash
npx @lsw-abpvue/cli new Acme.BookStore
```

## Before you start

| | |
| --- | --- |
| Node | 20 or newer |
| pnpm | Any recent version; npm and yarn work too |
| .NET SDK | Whatever the ABP version you are creating needs |
| The ABP CLI | `dotnet tool install -g Volo.Abp.Studio.Cli` |

`abpv doctor --offline` checks all four and prints the command that fixes each one.

Skip the last two if you already have a backend: `abpv new Acme.BookStore --no-backend
--backend https://localhost:44305` writes only the frontend.

## What the command does

1. Runs `abp new Acme.BookStore -t app -u no-ui -uost -csf`, plus whatever else you
   typed. Every `abp new` option is passed through untouched, so `-d mongodb`,
   `--separate-auth-server` and the rest work as they do with the official CLI.
2. Reads the solution off disk — not the exit code, which `abp new` returns as zero even
   when one of its post-actions failed.
3. Writes the frontend into `vue/`, next to the backend's `src/`.
4. Edits three values in the backend's configuration, without which nothing can sign in:
   the OpenIddict client's `RootUrl`, which is what the seeder builds its redirect URIs
   from, and the CORS origins of the hosts that answer the frontend. A solution generated
   with no UI has none of them.

```
Acme.BookStore/
├── src/                          the backend, by the official CLI
│   ├── Acme.BookStore.HttpApi.Host/
│   └── Acme.BookStore.DbMigrator/
└── vue/                          the frontend
    ├── src/
    │   ├── routes.ts             your routes, and the modules'
    │   ├── startup.ts            what the application provides
    │   └── pages/
    ├── public/dynamic-env.json   the backend URL, read at runtime
    └── package.json
```

## Running it

After generation, enter the solution directory and install the backend's client-side libraries:

```bash
cd Acme.BookStore
abp install-libs
```

The backend still needs these libraries with `no-ui`. If this step was skipped or an
ABP post-action failed, requests can return 500 with "The Libs Folder is Missing".

Then start the database, seed the application and run both hosts, in this order:

```bash
# 1. the database, if the template needs one
docker start bookstore-db

# 2. create the schema and seed the first user
cd src/Acme.BookStore.DbMigrator && dotnet run
```

::: warning
Run the migrator from inside its own project directory. From anywhere else it reads no
`appsettings.json` and connects to nothing.
:::

```bash
# 3. the backend
cd ../Acme.BookStore.HttpApi.Host && dotnet run
```

In a new terminal, from the generated solution's root:

```bash
cd vue && pnpm install && pnpm dev
```

The frontend is on <http://localhost:4200>, the backend on whatever port the template
picked — `abpv doctor` prints it. Sign in with `admin` and the password the migrator
seeded, which the template prints and is `1q2w3E*` unless you changed it.

## The options worth knowing

| | |
| --- | --- |
| `--port 5173` | The frontend's port. Everything that has to agree with it — the OpenIddict redirect URIs, the CORS origins, Vite — is written for you |
| `--modules identity,account` | Wire up only these module UIs. The dependencies stay whole: what is not routed is not bundled, which is tree-shaking's job, not the manifest's |
| `--sample-crud` | ABP's Books sample, backend and page, which is a working example of the extension system |
| `--with-source-code identity` | Put a module's UI source in the project from the start |
| `--no-backend --backend <url>` | Only the frontend, pointed at a backend you already have |
| `--dry-run` | Say what it would write and write nothing |

Everything the CLI does not recognise goes to `abp new` as it was typed.

## If sign-in does not work

```bash
cd vue && npx abpv doctor
```

It checks the ten things that break this: the toolchain, what the project says its
backend is, whether that backend answers, whether its certificate is trusted, whether
your origin is allowed, whether the identity server knows the client, whether the
redirect URI matches the one the client was seeded with, which ABP the solution was
generated for, whether the proxy still matches the API, and how much of the backend's
object extensions the mapping rules recognise. Each failure prints the command that
fixes it.

The first-run one is usually the development certificate: `dotnet dev-certs https
--trust`, then reload.

## Next

- [Configuration](./configuration) — where the backend URL comes from, and how to change
  it without rebuilding
- [Talking to the backend](./backend) — generating typed services from your own API
- [A CRUD page](./crud-page) — one command for one of your entities
