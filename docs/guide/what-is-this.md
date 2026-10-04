# Overview

Lsw.Abp.VueUI provides a Vue 3 frontend for ABP Framework applications. It is an unofficial community project under the MIT license, with npm packages in the `@lsw-abpvue/*` scope.

Applications use Vue Composition API, promises, refs and scoped slots. Shared services consume ABP configuration; module UIs use the corresponding backend DTOs, localization resources and policies.

## What is included

- Authentication through authorization code with PKCE or a local password flow.
- Configuration, localization, permission checks, tenant resolution and typed HTTP services.
- Bootstrap Basic Theme with responsive navigation, dark mode and RTL behavior.
- Account, identity, permission, tenant, feature and setting management UIs.
- Forms, list queries, feedback and extension points for reusable modules.
- A CLI for solution creation, UI integration, proxies, pages and reusable libraries.

## Backend relationship

Use the ABP endpoints already provided by your solution. No additional backend package is required for this frontend, but client URLs, CORS and seeded OpenIddict configuration must agree with it. Module screens require their corresponding backend modules and permissions.

## Reading this documentation

Start with [Quick Start](./new-solution) or [existing solution integration](./existing-solution). Development covers application work; Core Functionality and Utilities explain shared services; Customization covers theme and module changes; Components explains the controls and their usage.

The site follows `main`, while published alpha packages may lag behind it. See [versions and compatibility](/release/compatibility).
