# Components

Import the twelve theme controls from `@lsw-abpvue/theme-shared`. Import page and table components from `@lsw-abpvue/components`. Register a theme before rendering them; Basic Theme implements the contracts with Bootstrap styling.

## Theme controls

| Purpose | Components |
| --- | --- |
| Actions and input | [Button](./button), [Input](./input), [Select](./select), [Toggle](./toggle) |
| Forms | [Form field](./form-field), [Date picker](./date-picker), [Typeahead](./typeahead) |
| Overlays and feedback | [Modal](./modal), [Spinner](./spinner), [Toast host](./toast-host), [Confirmation host](./confirm-host) |
| Navigation | [Pagination](./pagination) |

## Page components

| Purpose | Components |
| --- | --- |
| Ordinary business pages | [Page](./page), [Data table](./data-table), [Row actions](./grid-actions), [Tabs](./tab-list) |
| Reusable module extensions | [Page toolbar](./page-toolbar), [Extensible table](./extensible-table), [Extensible form](./extensible-form), [Record modal](./record-modal) |

Each reference lists props, default values, events, slots and behavior. Tables are extracted from source. Theme-control defaults describe Basic Theme; another theme must preserve the public contract but can have different visual details.

Each page includes a complete typed example. Simple controls have interactive previews using isolated local state; backend workflows state their endpoint and DTO prerequisites. The same files are included in both languages. See [forms](/utilities/forms) and [lists](/utilities/lists) for complete request workflows. Properties documented as already localized need caller-translated text; properties accepting localization parameters can take `Resource::Key`.
