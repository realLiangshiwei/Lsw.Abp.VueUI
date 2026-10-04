# Create a solution

The CLI creates the ABP backend in `aspnet-core/` and the Vue frontend in `vue/`, matching the standard Angular solution layout.

## Prerequisites

Use Node 20 or newer, a package manager, the .NET SDK required by the target ABP version and the official ABP CLI:

```bash
dotnet tool install -g Volo.Abp.Studio.Cli
npm install -g @lsw-abpvue/cli@alpha
```

This example uses MongoDB. Run a local server or create one with Docker before seeding.

## Create

```bash
abpv new Acme.BookStore -d mongodb
```

```text
Acme.BookStore/
├── aspnet-core/
│   ├── src/
│   └── test/
└── vue/
```

The default frontend has a welcome page and module UIs. Add `--sample-crud` to include the Books sample. `--port`, `--modules` and other generation options are documented in [new](/cli/new).

## Start the backend

```bash
# First run, if no MongoDB server already uses port 27017:
docker run -d --name bookstore-db -p 27017:27017 mongo:8

cd Acme.BookStore/aspnet-core/src/Acme.BookStore.HttpApi.Host
abp install-libs
cd ../Acme.BookStore.DbMigrator
dotnet run
cd ../Acme.BookStore.HttpApi.Host
dotnet run
```

Run DbMigrator inside its own directory so it reads its configuration. On subsequent starts use `docker start bookstore-db`. If the backend uses a separate authentication server, start that host too.

## Start the frontend

In a new terminal, from the solution root:

```bash
cd vue
pnpm install
pnpm abpv doctor
pnpm dev
```

Open the URL printed by Vite and choose Login. The default code flow opens the authentication server and returns to Vue. Use the seeded admin credentials; the standard development password is `1q2w3E*` unless changed in your backend.

The CLI writes client URLs and CORS configuration, while DbMigrator seeds the database client. If login fails, consult [troubleshooting](./troubleshooting).

## Next

Read [configuration](./configuration), [project structure](/development/structure) and [business pages](./crud-page). For a frontend only, use `new --no-backend --backend <url>`; it writes frontend files directly into the output folder.
