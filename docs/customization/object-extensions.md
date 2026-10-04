# Object extensions

ABP sends module object-extension metadata in application configuration. Extensible module pages map supported properties into table columns and create/edit controls.

## What is mapped

Mapping reads property types, localization, validation attributes, enum options, UI visibility, order, permission and feature conditions, lookup configuration and read-only behavior. Runtime values live in `extraProperties`.

Backend object-extension metadata must identify the entity used by the module, such as `Identity.User` or `TenantManagement.Tenant`. Configure the extension on the ABP backend, then reload application configuration. Contributors run after the module defaults and object-extension mapping, so the host can reorder or remove the resulting fields.

## Application pages

An ordinary generated business page has explicit columns and form controls. Add extra-property controls and bindings yourself and preserve `extraProperties` in update requests. Automatic module mapping is not applied to those pages.

## Diagnose a missing field

Check that the metadata is present in `/api/abp/application-configuration`, that the property is visible for the current policy and feature conditions, and that the module entity name matches. Run `abpv doctor` to compare supported mappings with the backend metadata.

A lookup property requires a usable lookup endpoint and display values. Unknown metadata does not create an arbitrary widget. The [extensions guide](/concepts/extensions) shows how to contribute a custom control or value resolver.
