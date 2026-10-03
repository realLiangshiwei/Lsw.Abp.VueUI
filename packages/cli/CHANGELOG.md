# @lsw-abpvue/cli

## 0.0.1-alpha.2

### Patch Changes

- ffe8cd5: Synchronize the selected language with the backend culture cookie, including restored
  sessions and changes from another tab. Preserve backend action policies under the
  requested base permission when generating CRUD pages, including `.Edit` permissions.
- Updated dependencies [ffe8cd5]
  - @lsw-abpvue/core@0.0.1-alpha.2

## 0.0.1-alpha.1

### Patch Changes

- Add automatic imports for common Vue and ABP APIs in application templates and generated pages, with initial TypeScript declarations. Generate application proxies by default and omit internal template changelogs from new projects.

  Fix repeated form option requests, released source package resolution, language persistence, localized page titles, form layout attributes, and modal title accessibility.

- Updated dependencies
  - @lsw-abpvue/core@0.0.1-alpha.1

## 0.0.1-alpha.0

### Patch Changes

- First public alpha of the ABP Vue UI, including framework services, OAuth, extensible components, business modules, generation tools and documentation. Refresh the Bootstrap theme with consistent navigation, tables, forms, dialogs and account pages.
