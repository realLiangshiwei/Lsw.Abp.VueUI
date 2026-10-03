# @lsw-abpvue/cli

## 0.0.1-alpha.4

### Patch Changes

- e556960: Preserve existing template and application routes when generating their pages, and reject conflicting route changes.
  - @lsw-abpvue/core@0.0.1-alpha.4

## 0.0.1-alpha.3

### Patch Changes

- 86747fc: Generate solutions with sibling aspnet-core and vue directories, matching ABP's Angular layout. Support this layout when adding Vue to an existing solution and diagnosing it, including custom output paths, previews and failure cleanup.
- 8e63363: Prebundle installed application entry points before automatic imports discover them, while preserving one dependency injection instance for released package sources.
- 86747fc: Generate application CRUD pages with explicit table columns, form controls and CRUD methods instead of module extension registration and record editors. Put templates before scripts, simplify the optional Books example, and preserve existing legacy extension files during regeneration.
- 8e63363: Require complete verification before publishing, including tests, coverage, builds, and clean external consumer checks.
- Updated dependencies [8e63363]
  - @lsw-abpvue/core@0.0.1-alpha.3

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
