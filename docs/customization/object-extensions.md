# Object extensions

ABP exposes module object-extension metadata in application configuration. Supported reusable module pages map it to table columns and form controls. The backend owns property definition, authorization, validation and persistence.

## Add a backend property

In your solution's Domain.Shared `<Project>ModuleExtensionConfigurator`, place this API configuration in the existing `ConfigureExtraProperties()` method:

~~~csharp
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Identity;
using Volo.Abp.ObjectExtending;
using Volo.Abp.ObjectExtending.Modularity;

ObjectExtensionManager.Instance.Modules().ConfigureIdentity(module =>
    module.ConfigureUser(entity =>
        entity.AddOrUpdateProperty<string>("SocialSecurityNumber", property =>
        {
            property.Attributes.Add(new RequiredAttribute());
            property.Attributes.Add(new StringLengthAttribute(64) { MinimumLength = 4 });
            property.UI.OnTable.IsVisible = true;
            property.UI.OnCreateForm.IsVisible = true;
            property.UI.OnEditForm.IsVisible = true;
        })));
~~~

Ensure the solution calls its existing configurator during startup. This configures Identity.User metadata; it does not install another backend package for Vue.

Use the database mapping mechanism required by your ABP version/provider. A dedicated EF Core column requires the corresponding object-extension mapping and database migration; extra-property storage can instead remain in the provider's existing extra-properties field. Rebuild/restart the backend and verify persistence in that solution.

Adding a required property to existing users requires a plan for their missing values. Use this example in a development solution or provide an appropriate data migration.

## Check runtime metadata

For the same authenticated host/tenant as the page, inspect:

~~~text
/api/abp/application-configuration
objectExtensions.modules.Identity.entities.User.properties.SocialSecurityNumber
~~~

Check the type, attributes, `api.onGet/onCreate/onUpdate` and `ui.onTable/onCreateForm/onEditForm` flags. UI visibility and API availability serve different purposes. Add the property display-name localization to your backend resource.

Refreshing configuration updates metadata; re-enter the module route to rebuild its configured extension lists. If startup used older metadata, reload the application.

## Automatic frontend mapping

The mapping covers supported types, enum choices, validation attributes, lookup URLs, default values, UI visibility, order, readonly configuration and permission/feature conditions. Unknown type metadata may fall back to text; it does not create an arbitrary custom widget.

Identity users resolve `Identity.User`; roles resolve `Identity.Role`; tenants resolve `TenantManagement.Tenant`. These entity names differ from replaceable component keys such as `Identity.UsersComponent`.

You do not need a contributor just to show a supported backend property. Add [form contributors](/customization/form-fields) when you need to override its position, component or validators.

## Save and preserve values

A create/update body carries the value under:

~~~json
{
  "extraProperties": {
    "SocialSecurityNumber": "12345678"
  }
}
~~~

This excerpt omits the endpoint's other required fields. On edit, `useExtensibleForm(record).toRequestBody()` begins with existing extra properties and overlays edited controls. Hidden properties are preserved, so a save does not delete data the user never saw.

Automatic UI mapping is not proof of persisted storage. Create a record, save, reopen it and inspect a fresh GET response. Also send an invalid value and check that the backend rejects it.

## Ordinary business pages

Generated application pages explicitly own their controls and columns. Add the desired control yourself and merge edited extra values into the existing `extraProperties` object. Those pages do not automatically consume module contributor metadata.

## Diagnose a missing field

| Symptom | Check |
| --- | --- |
| Not in configuration | Backend configurator, entity name and API availability |
| In configuration but not displayed | UI flags, current policy/features and supported type |
| Appears twice | A host contributor added the same name without removing the mapped field |
| Save succeeds but value disappears | Endpoint mapping and actual database persistence |
| Lookup shows raw ids | Lookup endpoint, display/value property names and permissions |
| Different tenant/user behaves differently | Effective configuration for that exact session |

`abpv doctor` compares metadata with supported mappings; it cannot verify your database's persistence semantics. See [extensions](/concepts/extensions), [form fields](/customization/form-fields).

## End-to-end development sequence

1. Define the property and its validation/UI/API flags in the backend configurator. Confirm the configurator is called before module metadata is assembled.
2. Add its display-name texts to the backend resource for every supported culture.
3. Choose the provider's persistence strategy. For a mapped EF Core column, add the mapping and migration; for an extra-properties field, verify the endpoint/entity mapping retains the value.
4. Restart the backend and inspect application configuration in the intended host/tenant session.
5. Open Users. A supported automatically mapped property needs no frontend contributor. Add a contributor only for a deliberate override.
6. Create, save, GET the detail, edit, save again and GET again. Inspect both request and response extraProperties.

For a required new property on existing records, seed or migrate values before enforcing it everywhere. A frontend-only default does not repair existing database rows. For lookup properties, check lookup URL, id/display member names and access permissions with that same session.

## Override one mapping safely

The SocialSecurityNumber example in [form fields](/customization/form-fields) removes the same-name automatic property before adding its own. This avoids two controls for one payload member and explicitly keeps required/length rules. Add a corresponding entity-prop contributor only if the table also needs a different renderer.

An ordinary business page must merge edited extras into its loaded record's extras. Sending only the one visible extra value can delete hidden values if the backend replaces the dictionary. The reusable editor uses toRequestBody to preserve them, but a hand-written page owns that body.

## What the frontend cannot infer

The UI metadata does not prove a database migration ran, that an application service copies extras correctly, or that an authorization rule is implemented. Doctor checks supported mapping coverage, not successful round-trip persistence. Treat a field appearing in the UI as the beginning of verification rather than the end.
