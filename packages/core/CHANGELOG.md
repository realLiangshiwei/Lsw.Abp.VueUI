# @lsw-abpvue/core

## 0.0.1-alpha.4

### Patch Changes

- @lsw-abpvue/utils@0.0.1-alpha.4

## 0.0.1-alpha.3

### Patch Changes

- 8e63363: Keep the HTML language synchronized with the selected culture when restoring a session,
  changing languages or receiving a session update from another tab. Add an optional
  DocumentService language setter that remains safe without a browser and compatible
  with existing platform replacements.
  - @lsw-abpvue/utils@0.0.1-alpha.3

## 0.0.1-alpha.2

### Patch Changes

- ffe8cd5: Synchronize the selected language with the backend culture cookie, including restored
  sessions and changes from another tab. Preserve backend action policies under the
  requested base permission when generating CRUD pages, including `.Edit` permissions.
  - @lsw-abpvue/utils@0.0.1-alpha.2

## 0.0.1-alpha.1

### Patch Changes

- Add automatic imports for common Vue and ABP APIs in application templates and generated pages, with initial TypeScript declarations. Generate application proxies by default and omit internal template changelogs from new projects.

  Fix repeated form option requests, released source package resolution, language persistence, localized page titles, form layout attributes, and modal title accessibility.
  - @lsw-abpvue/utils@0.0.1-alpha.1

## 0.0.1-alpha.0

### Patch Changes

- First public alpha of the ABP Vue UI, including framework services, OAuth, extensible components, business modules, generation tools and documentation. Refresh the Bootstrap theme with consistent navigation, tables, forms, dialogs and account pages.
- Updated dependencies
  - @lsw-abpvue/utils@0.0.1-alpha.0
