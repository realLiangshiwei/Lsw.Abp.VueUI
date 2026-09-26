# An existing solution

`abpv switch-ui` adds a Vue UI to an ABP solution that already has one, or has none.

```bash
abpv switch-ui                  # renames angular/ to angular.bak/ and adds vue/
abpv switch-ui --mode keep      # leaves the old UI where it is
abpv switch-ui --port 5173
abpv switch-ui --dry-run        # says what it would do to your files
```

## It is deliberately timid

It edits files you already have, so:

| | |
| --- | --- |
| It stops on an uncommitted working tree | Unless you pass `--force`. Your diff is the undo button |
| It copies every file before editing it | The copy is what a rollback puts back |
| It edits JSON through an AST | Comments, key order and formatting survive |
| It never touches a `.cs` file | The backend's code is not its business |
| It renames rather than deletes | `angular/` becomes `angular.bak/` |
| It puts everything back if it cannot finish | Half-applied is the one outcome worth ruling out |
| `--dry-run` prints every edit | Including the ones to your backend's configuration |

## What it changes on the backend

The same three values `abpv new` writes, and for the same reason: without them nothing
can sign in.

| | |
| --- | --- |
| The OpenIddict client's `RootUrl` | What the data seeder builds the redirect URIs from |
| `CorsOrigins` | The frontend's origin, on every host that answers it |
| `RedirectAllowedUrls` | Where the identity server is allowed to send the visitor back |

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
cd vue && pnpm install && pnpm dev
npx abpv doctor
```

If sign-in fails, `doctor` names which of the ten usual mismatches it is and prints the
command that fixes it.
