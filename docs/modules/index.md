# Module UIs

Six open-source ABP module UIs are available. Install the matching backend module before exposing its frontend routes or dialogs. Your application also needs core, authentication and a registered theme.

| UI | Package | Integration |
| --- | --- | --- |
| [Account](./account) | `@lsw-abpvue/account` | Pages and profile tabs |
| [Identity](./identity) | `@lsw-abpvue/identity` | Users and roles routes |
| [Permission management](./permission-management) | `@lsw-abpvue/permission-management` | Provider dialog |
| [Tenant management](./tenant-management) | `@lsw-abpvue/tenant-management` | Tenant routes |
| [Feature management](./feature-management) | `@lsw-abpvue/feature-management` | Provider dialog and settings contribution |
| [Setting management](./setting-management) | `@lsw-abpvue/setting-management` | Settings routes and tabs |

`account-core` contains shared tenant and profile services used by account and themes. Built-in services and DTOs live in public `/proxy` entry points; lightweight startup registrations live in `/config` where provided.

## Integration pattern

Register configuration providers at application startup, and load module routes lazily. The CLI template wires selected modules. Installing a package alone does not create its routes or menu entries.

## Customization

Module tables and forms support contributors. Use a stable component key for each page, and register column, action, toolbar and form changes through the module's route options.

Each module guide describes its routes, backend prerequisites and management policies. Enable a module only when its endpoints and policies are available in the connected backend.
