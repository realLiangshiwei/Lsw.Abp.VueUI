# abpv generate

```bash
abpv generate Book
abpv generate Book --policy Acme.BookStore.Books --icon "bi bi-book"
abpv generate Book --force
```

Writes `src/pages/BooksPage.vue` and one route. The page directly owns its columns, form
controls and CRUD methods. It needs a proxy because it imports the generated service and DTOs.

|                                                                     |                                                                                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--module <name>`                                                   | Which `api-definition` module to look in; all of them otherwise                                                                                      |
| `--target <dir>`                                                    | Where the page goes; default `src/pages`                                                                                                             |
| `--proxy <dir>`                                                     | Where the proxy is; default `src/proxy`                                                                                                              |
| `--routes <file>`                                                   | The file that declares the routes; default `src/routes.ts`                                                                                           |
| `--no-router`                                                       | Do not touch the routes file                                                                                                                         |
| `--resource <name>`                                                 | The localization resource; the backend's default otherwise                                                                                           |
| `--extension-module <m>`                                            | Legacy compatibility option; direct application pages do not register extensions                                                                     |
| `--route` / `--menu` / `--icon`                                     | Override what is inferred                                                                                                                            |
| `--policy <name>`                                                   | The base permission; matching backend action policies such as `.Edit` are kept, missing or unrelated policies use `.Create`, `.Update` and `.Delete` |
| `--force`                                                           | Replace the entire existing Vue page; save custom changes first                                                                                      |
| `--url` / `--source` / `--config-source` / `--token` / `--insecure` | As in `proxy`                                                                                                                                        |
| `--no-auto-imports`                                                 | Write explicit common imports instead of using the application preset                                                                                |
| `--dry-run`                                                         | Say what would change and write nothing                                                                                                              |

Full walkthrough: [A CRUD page](../guide/crud-page).

## How it decides

By HTTP shape, not by method name. The GET with no route parameter returning
`PagedResultDto<T>` is the list; `T` is the record; the body of the POST is the form. A
service that renamed `GetListAsync` still works.

Field controls use the full backend type rather than only its simplified JSON type, so dates can use date controls.

Service and DTO names come from replaying the proxy generation in memory with the options
`generate-proxy.json` recorded — two modules with a `BookDto` each mean one was renamed,
and the page has to import the name that was written.

`--module` also accepts `-m`. `--auto-imports` enables the preset-based generation explicitly; its default follows `package.json`.
