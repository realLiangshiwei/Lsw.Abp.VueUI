# abpv generate

```bash
abpv generate Book
abpv generate Book --policy Acme.BookStore.Books --icon "bi bi-book"
abpv generate Book --force
```

Writes `src/pages/BooksPage.vue`, `src/pages/books.extensions.ts` and one route. Needs a
proxy: the page imports the generated service and its DTOs.

| | |
| --- | --- |
| `--module <name>` | Which `api-definition` module to look in; all of them otherwise |
| `--target <dir>` | Where the page goes; default `src/pages` |
| `--proxy <dir>` | Where the proxy is; default `src/proxy` |
| `--routes <file>` | The file that declares the routes; default `src/routes.ts` |
| `--no-router` | Do not touch the routes file |
| `--resource <name>` | The localization resource; the backend's default otherwise |
| `--extension-module <m>` | Where the backend files this entity's object extensions, as `Module` or `Module.Entity`; the resource and the entity name otherwise |
| `--route` / `--menu` / `--icon` | Override what is inferred |
| `--policy <name>` | The base permission; matching backend action policies such as `.Edit` are kept, missing or unrelated policies use `.Create`, `.Update` and `.Delete` |
| `--force` | Rewrite the generated blocks of files already there |
| `--url` / `--source` / `--config-source` / `--token` / `--insecure` | As in `proxy` |
| `--dry-run` | Say what would change and write nothing |

Full walkthrough: [A CRUD page](../guide/crud-page).

## How it decides

By HTTP shape, not by method name. The GET with no route parameter returning
`PagedResultDto<T>` is the list; `T` is the record; the body of the POST is the form. A
service that renamed `GetListAsync` still works.

`PropType` comes from `type` rather than `typeSimple`, because ABP reports a `DateTime`
as a simple `string` and a table built from that shows dates as text.

Service and DTO names come from replaying the proxy generation in memory with the options
`generate-proxy.json` recorded — two modules with a `BookDto` each mean one was renamed,
and the page has to import the name that was written.
