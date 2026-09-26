# abpv switch-ui

```bash
abpv switch-ui                  # renames angular/ to angular.bak/ and adds vue/
abpv switch-ui --mode keep      # leaves the old UI where it is
abpv switch-ui --port 5173
abpv switch-ui --dry-run
```

| | |
| --- | --- |
| `--mode <replace\|keep>` | Whether the old UI is renamed out of the way |
| `--port <n>` | The frontend's port, written everywhere it has to agree |
| `--modules <list>` | Which module UIs to wire up |
| `--force` | Proceed on an uncommitted working tree |
| `--dry-run` | Every edit it would make, including to the backend's configuration |

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
