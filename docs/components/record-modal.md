# AbpRecordModal

AbpRecordModal is part of a reusable module's extension-based page. For a business page owned by one application, explicit columns, buttons and form state are usually sufficient.

## Connect an editor to a dialog

<<< ../examples/catalog-extensions.ts

<<< ../examples/CatalogModulePage.vue

This complete integration assumes `/api/app/documentation-catalog` supports GET list, POST create, PUT update and DELETE, and returns records with id/name and optional concurrencyStamp/extraProperties. Copy both files, add catalogExtensions to the existing startup providers, and register a route for CatalogModulePage. Defaults are registered before the page mounts; register host contributors after these defaults. The page supplies CATALOG_PAGE commands and does not clear host contributions. A packaged module can expose contributor options through its route resolver as described in the module tutorial. The application layout supplies notification and confirmation hosts.

## Data and lifecycle

Create one `useRecordEditor` in setup. `show()` opens creation; `show(record)` opens editing. If a list DTO omits editable fields or the concurrency stamp, fetch the detail DTO before showing it. The editor validates and builds the body, passes the concurrency stamp on update, keeps the dialog on failure and reloads on success. Delete asks confirmation first. Header/body/footer slots replace their respective default rendering; bind busy states on custom controls. The optional `save` prop replaces submission, so the page must preserve validation, error handling and successful close behavior itself.

## Extend the module

Use a stable public component identifier such as `Catalog.BooksComponent`. Consumers register contributors under that identifier. A changed key starts a different extension bucket and preference identity. Contributors execute in registration order; adding the same name again does not automatically replace it.

A reusable module should expose defaults and contributor options through its public entry. Follow [the reusable module tutorial](/tutorials/module) for package startup and route registration. [Extension behavior](/customization/extension-behavior) explains defaults, ordering and diagnostics.

## Check the completed workflow

Open the list, create a valid record, edit a fetched record, reject deletion once and confirm it once. Check a failed request retains values, extra properties survive an edit, and list refresh preserves or resets the page as intended. Then add one host contributor and verify the default still exists exactly once.

Install [the supplied catalogue backend](/tutorials/backend-examples) before running this page. It uses an in-memory teaching store and the existing `AbpIdentity.Users` policy; the endpoint is not part of every ABP application.

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpRecordModal.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name          | Type                                        | Required | Default |
| ------------- | ------------------------------------------- | -------- | ------- |
| `editor`      | `RecordEditor<R>`                           | Yes      | —       |
| `label`       | `LocalizationParam`                         | Yes      | —       |
| `createTitle` | `LocalizationParam`                         | Yes      | —       |
| `editTitle`   | `LocalizationParam \| undefined`            | No       | —       |
| `size`        | `'sm' \| 'md' \| 'lg' \| 'xl' \| undefined` | No       | —       |
| `save`        | `(() => void) \| undefined`                 | No       | —       |

### Events

No component-specific events are declared.

### Slots

| Name      | Context                                                |
| --------- | ------------------------------------------------------ |
| `default` | `() => unknown`                                        |
| `header`  | `() => unknown`                                        |
| `footer`  | `(context: { close: () => Promise<void> }) => unknown` |

<!-- component-contract:end -->
