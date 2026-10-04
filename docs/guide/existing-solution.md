# An existing solution

`abpv switch-ui` adds a Vue UI to an ABP solution that already has one, or has none.

```bash
npx @lsw-abpvue/cli@alpha switch-ui                  # renames angular/ to angular.bak/ and adds vue/
npx @lsw-abpvue/cli@alpha switch-ui --mode keep      # leaves the old UI where it is
npx @lsw-abpvue/cli@alpha switch-ui --port 5173
npx @lsw-abpvue/cli@alpha switch-ui --dry-run        # says what it would do to your files
```

## Project layout and safeguards

The standard project layout separates the backend and frontend:

```text
Acme.BookStore/
├── aspnet-core/
├── angular/          # kept with --mode keep; otherwise renamed to angular.bak/
└── vue/
```

Run the command from the project root, `aspnet-core/`, the existing frontend or their
subdirectories. `--solution` accepts either the project root or backend directory.
`--dir` is relative to the project root and must stay separate from the backend.
Existing flat solutions are recognised without relocating their backend. `doctor` can
also find the sibling backend when run from `vue/`.

It edits files you already have, so:

|                                             |                                                         |
| ------------------------------------------- | ------------------------------------------------------- |
| It stops on an uncommitted working tree     | Unless you pass `--force`. Your diff is the undo button |
| It copies every file before editing it      | The copy is what a rollback puts back                   |
| It edits JSON through an AST                | Comments, key order and formatting survive              |
| It never touches a `.cs` file               | The backend's code is not its business                  |
| It renames rather than deletes              | `angular/` becomes `angular.bak/`                       |
| It puts everything back if it cannot finish | Half-applied is the one outcome worth ruling out        |
| `--dry-run` prints every edit               | Including the ones to your backend's configuration      |

## What it changes on the backend

The same three values `abpv new` writes, and for the same reason: without them nothing
can sign in.

|                                   |                                                               |
| --------------------------------- | ------------------------------------------------------------- |
| The OpenIddict client's `RootUrl` | What the data seeder builds the redirect URIs from            |
| `CorsOrigins`                     | The frontend's origin, on every host that answers it          |
| `RedirectAllowedUrls`             | Where the identity server is allowed to send the visitor back |

A value that is already right is left alone — including the empty entry the official
template leaves after a trailing comma, which is semantically nothing and not worth a
diff.

Re-run the data seeder afterwards (`dotnet run` in the `DbMigrator` project): the
OpenIddict client is seeded, so the new redirect URIs only reach the database that way.

## Keeping both UIs

`--mode keep` leaves `angular/` where it is and adds `vue/` beside it. Both can run at
once if they are on different ports and both origins are allowed — useful while you move
page by page.

## Afterwards

```bash
cd vue
pnpm install
pnpm abpv doctor
pnpm dev
```

If sign-in fails, `doctor` names which of the ten usual mismatches it is and prints the
command that fixes it.

Open the frontend URL printed by Vite, then click **Login** in the top-right navbar.
The default flow opens the backend's login page and returns to Vue after authentication.

To add a page for an entity already on the backend, follow [A CRUD page](./crud-page).
The BookStore sample uses `pnpm abpv proxy add --module app` and `pnpm abpv generate Book`
from `vue/`, before starting `pnpm dev`. If the server is already running, stop and
restart it after generation. Append `--insecure` to each command for a local development
certificate that Node does not trust.
