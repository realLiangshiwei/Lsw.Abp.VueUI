# abpv switch-ui

```bash
abpv switch-ui                  # renames angular/ to angular.bak/ and adds vue/
abpv switch-ui --mode keep      # leaves the old UI where it is
abpv switch-ui --port 5173
abpv switch-ui --dry-run
```

|                          |                                                                      |
| ------------------------ | -------------------------------------------------------------------- |
| `--mode <replace\|keep>` | Whether the old UI is renamed out of the way                         |
| `--solution <path>`      | Project root or `aspnet-core/`; discovered upwards when absent       |
| `--dir <path>`           | Frontend subdirectory relative to the project root; `vue` by default |
| `--port <n>`             | The frontend's port, written everywhere it has to agree              |
| `--modules <list>`       | Which module UIs to wire up                                          |
| `--force`                | Proceed on an uncommitted working tree                               |
| `--dry-run`              | Every edit it would make, including to the backend's configuration   |

The dry run prints a full unified diff of generated text files and backend configuration
edits, including comments and surrounding context. Renames and binary files are listed
separately. Existing backups are preserved by choosing the next available `.1.bak`,
`.2.bak` and so on. Previewing writes no files and runs no dependency installation.

For the standard `aspnet-core/` + `angular/` layout, `vue/` is added beside both
directories. Run from the project root, backend, existing frontend or their subdirectories,
or pass either the project root or backend directory with `--solution`. Paths in the
preview are relative to the project root. Existing flat solutions are also recognised
and keep their backend in its current location.

`--dir` must stay inside the project and cannot overwrite the backend directory.

## Seven rules it follows

1. Stop on an uncommitted working tree unless `--force` — your diff is the undo button.
2. Copy every file before editing it.
3. Edit JSON through an AST, so comments and formatting survive.
4. Never touch a `.cs` file.
5. Rename rather than delete.
6. Put everything back if it cannot finish.
7. Leave a value that is already correct alone.

## Afterwards

Run the DbMigrator again. The OpenIddict client is seeded, so new redirect URIs only reach
the database that way.

## Additional generation options

`--template <dir>`, `--package-manager <name>` (default pnpm), `--with-source-code <list>`, `--skip-install` and `--skip-proxy` control frontend generation. `--skip-backend-config` leaves backend settings for you to synchronize. The default port is 4200.
