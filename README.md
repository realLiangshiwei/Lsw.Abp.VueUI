# Lsw.Abp.VueUI

[English](README.md) | [简体中文](README.zh-CN.md)

[![npm alpha](https://img.shields.io/npm/v/%40lsw-abpvue%2Fcli/alpha?label=npm%20alpha&style=flat-square)](https://www.npmjs.com/package/@lsw-abpvue/cli) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

**Lsw.Abp.VueUI** provides a Vue 3 frontend for applications built with the [ABP Framework](https://abp.io/), including authentication, application modules, Bootstrap themes and a CLI.

The project follows the capabilities and extension points of ABP's Angular UI using Vue's Composition API. It consumes existing ABP APIs without requiring an additional backend package.

This is an **unofficial community project**, not affiliated with Volosoft. Prerelease packages are available through the **`alpha`** tag.

## Getting Started

### Create a new solution

Install the CLIs and create a solution:

```bash
dotnet tool install -g Volo.Abp.Studio.Cli
npm install -g @lsw-abpvue/cli@alpha
abpv new Acme.BookStore -d mongodb
```

`abpv` creates the backend through the official ABP CLI's `no-ui` template and adds a Vue frontend. The layout follows ABP's Angular solution, with `vue/` as the frontend directory:

```text
Acme.BookStore/
├── aspnet-core/
│   ├── src/     # ABP backend projects
│   └── test/    # Backend tests
└── vue/         # Vue frontend
```

### Use an existing ABP solution

Add Vue to an existing solution while keeping its current UI:

```bash
abpv switch-ui --mode keep
```

## Features

- **Authentication** — authorization code flow with PKCE, token renewal, login and logout.
- **Authorization** — permission checks for routes, menus, components and actions.
- **Multi-tenancy** — tenant selection and tenant-aware API requests.
- **Localization** — backend resources, language switching and RTL layouts.
- **Application services** — dependency injection, configuration, HTTP services and list management.
- **Validation and feedback** — form validation, server errors, confirmations and notifications.

## Themes

The included **Basic Theme** uses **Bootstrap 5** styles and **Reka UI** controls, with responsive navigation, light and dark modes, RTL support and shared form controls. Module UIs use theme contracts so applications can provide their own theme.

## Application Modules

The following open source ABP module UIs are available as separate packages:

| Module                | Package                             | Features                                                      |
| --------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Account               | `@lsw-abpvue/account`               | Login, registration, password recovery and profile management |
| Identity              | `@lsw-abpvue/identity`              | Users, roles and their permissions                            |
| Permission Management | `@lsw-abpvue/permission-management` | Permission management dialog                                  |
| Tenant Management     | `@lsw-abpvue/tenant-management`     | Tenants, connection strings and tenant features               |
| Feature Management    | `@lsw-abpvue/feature-management`    | Feature management dialog                                     |
| Setting Management    | `@lsw-abpvue/setting-management`    | Settings page                                                 |

## Templates and Tooling

### Application template

The application template includes Vue 3, TypeScript, Vue Router and Vite, with authentication, module routes and runtime configuration. Common Vue and ABP components and APIs support **automatic imports on demand**.

### The `abpv` CLI

Both `abpv` and `abpvue` invoke the same CLI.

| Command       | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `new`         | Create an ABP backend and Vue frontend                         |
| `switch-ui`   | Add Vue to an existing solution                                |
| `proxy`       | Generate typed services, DTOs, validators and permission names |
| `generate`    | Generate a CRUD page for a backend entity                      |
| `add-package` | Add a module package, optionally with its source code          |
| `create-lib`  | Create a reusable module UI package                            |
| `doctor`      | Diagnose environment, backend and authentication configuration |
| `update`      | Update the project's ABP Vue packages                          |

## Documentation and Samples

- [Documentation](https://realliangshiwei.github.io/Lsw.Abp.VueUI/) — English and Chinese guides for the framework, CLI and components.
- [Playground](playground/) — a BookStore application demonstrating module UIs and extension points.

## Contributing

Bug reports, documentation improvements and pull requests are welcome. Please use [GitHub Issues](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/issues) to report problems or propose features.

## License

Lsw.Abp.VueUI is released under the [MIT License](LICENSE). ABP Framework and other dependencies retain their respective licenses.
