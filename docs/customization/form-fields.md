# Dynamic form field extensions

Create and edit forms have separate contributors. This example positions a required `SocialSecurityNumber` extra property after surname.

## Configure the backend first

The Identity user extension must declare `SocialSecurityNumber` as a string, allow the create/edit UI and accept it in create/update requests. The frontend contributor alone cannot add persisted storage. Follow [object extensions](/customization/object-extensions) before using this example.

## Define the fields

<<< ../examples/user-form-fields.ts

## Register with the module routes

Copy the example into `src/identity-options.ts` and use its exported options in `src/routes.ts`:

~~~ts
import { lazyRoutes } from '@lsw-abpvue/core/router';
import { userFormFields } from './identity-options';

const identityRoute = lazyRoutes('/identity', () =>
  import('@lsw-abpvue/identity').then(module => module.createIdentityRoutes(userFormFields)),
);
~~~

Add `identityRoute` to the application's route array and keep `provideIdentityConfig()` in startup. Replace the existing identity route rather than registering two routes for the same prefix. Restart the development server when changing module setup, then open `/identity/users`.


The contributor removes an automatically mapped property with the same name before inserting its replacement. This preserves one control. A contributor that removes mapped validators must supply the intended rules again.

## Field options

| Option | Default / behavior |
| --- | --- |
| `type` | Required; picks the theme control |
| `isExtra` | False; true puts the value under `extraProperties` |
| `defaultValue` | Used when no existing value is available |
| `validators` | No validators; returns `AbpValidator[]` |
| `disabled` / `readonly` | Predicates, default false |
| `visible` / `permission` | Rendering conditions |
| `options` | Choices for enum/select/typeahead; supports value, Promise, Ref or getter |
| `group` | Fields with the same group name render together |
| `component` | Replaces the type's control |

Use `FormProp<IdentityUserDto>` even though the control edits a single string: the generic describes the whole record available to callbacks. Edit callbacks can inspect the existing record; create callbacks cannot assume an existing id.

A select can supply `options: () => [{ value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }]`. Localize labels yourself when returning option labels.

## Custom control contract

A custom field component receives `modelValue`, `prop`, `record`, `disabled` and `readonly`. Emit `update:modelValue` to update the control. Do not treat the record as a writable form model. Use the matching model type, respect disabled/readonly state, and preserve keyboard and accessible-label behavior.

For a single page's field rendering, the `field-{name}` slot on `AbpExtensibleForm` receives `{ prop, control }`. Bind `control.value` rather than assigning to `record.extraProperties`.

## Payload and validation

`useExtensibleForm(record).toRequestBody()` writes extra controls under `extraProperties` and preserves existing extra properties that were not displayed. A custom replacement page must use this body when submitting. Server validators remain authoritative.

Frontend disabled/readonly states do not prevent a forged request. To prohibit editing a property, enforce that rule in the backend too.

## Verify

Create a user with a valid value, reopen it for editing and confirm the value is retained. Submit an empty or too-short value and confirm a field message appears. Inspect the payload for `extraProperties.SocialSecurityNumber` and verify the value is returned by a subsequent GET.

See [extension behavior](/customization/extension-behavior), [validation](/utilities/forms) and [object extensions](/customization/object-extensions).

## Conditional behavior and an edited form

A predicate's data.record is the supplied record, not an implicit live form object. A create form cannot assume a stored id, and inspecting record.isActive does not automatically observe a newly edited isActive control. For conditions based on edited values, render an application-owned field/slot against the actual control state and use a conditional validator with context.valueOf. See [custom form rules](/utilities/forms).

Visible, disabled and readonly are UI decisions. Hidden controls remain part of the built form, and existing validators can still prevent submission. If a required value is only meaningful in one condition, write that condition into validation as well. Do not erase a hidden extra property just because it was not rendered.

## A custom field component

Use a component with modelValue, prop, record, disabled and readonly props and an update:modelValue event. A custom string control can wrap AbpInput, forwarding these states and the field's id/description attributes. A field slot receives its control directly; emit to control.value, not to the backend record. Prefer a slot for an application-specific rendering override and a contributed component for a reusable control.

## Create versus edit

Register separately for create and edit even when both use the same callback. A create default is a starting value; an edit form uses returned record/extraProperties values first. A concurrency stamp is not a visible text field: retain it in the editor's update workflow. Fetch the full record when a list response omits fields needed for editing.

After altering contributors, re-enter the route so the form uses the resolved lists. Add/remove/reorder before opening; altering a registry does not safely migrate the state of an already open form.


## Complete custom control

The backend must declare EmployeeCode as an optional string extra property and allow it in create/update DTOs. Copy both files and pass customUserControl to the existing createIdentityRoutes options. Add BookStore::EmployeeCode to the resources. The component uppercases input and forwards inherited field attributes to AbpInput.

<<< ../examples/CustomCodeInput.vue

<<< ../examples/custom-user-control.ts
