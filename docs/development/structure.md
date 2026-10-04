# Project structure

The standard solution follows ABP's Angular layout, with `vue/` as the frontend directory:

```text
Acme.BookStore/
├── aspnet-core/
│   ├── src/
│   └── test/
└── vue/
    ├── src/
    │   ├── main.ts
    │   ├── startup.ts
    │   ├── env.ts
    │   ├── routes.ts
    │   ├── pages/
    │   └── proxy/
    ├── public/dynamic-env.json
    ├── abp-auto-imports.ts
    └── package.json
```

## Files you change

| File | Responsibility |
| --- | --- |
| `main.ts` / `startup.ts` | Application creation, providers and module configuration |
| `routes.ts` | Vue routes and application menu metadata |
| `env.ts` | Built-in environment defaults |
| `public/dynamic-env.json` | Runtime deployment configuration |
| `pages/` | Your Vue business pages |
| `proxy/` | Generated application services and DTOs |
| `abp-auto-imports.ts` | Build-time imports for frequently used APIs and components |

The default template has a welcome page and the selected module UIs. Books and authors are added only with `--sample-crud`. A frontend-only `new --no-backend` places these frontend files directly in the chosen output folder.

## Package entry points

Module packages expose the main UI, lightweight `/config` providers, and typed `/proxy` services. Register configuration at startup and load UI routes lazily. Application-specific proxies belong in `src/proxy`; built-in module proxies are already in their packages.

See [startup](/development/startup), [API proxies](/guide/backend), and [package dependencies](/concepts/packages).
