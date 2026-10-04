# API reference

This reference covers public exports of the workspace packages, including their config, proxy, router, object-extension and testing entry points where available.

## Start with behavior

[Service and composable guide](./services) connects common tasks to the right service. [Components](/components/) lists props, events, slots and defaults. Individual package pages list exported values and types and link to their source declarations.

## Version scope

The site follows `main`. The currently published alpha line is documented in [versions and compatibility](/release/compatibility). Before copying an API into a project, compare the installed version with the release notes; a source export can be newer than the installed package.

Use documented package entry points. Internal file paths are implementation details. Generated business DTOs depend on your backend and are not part of this shared reference.

## Imports

Public values are runtime exports; type-only exports require `import type` or an inline `type` modifier. The application preset can automatically import common runtime APIs, but explicit imports remain valid and are recommended in reusable libraries.
