# Forms and validation

`useAbpForm` builds reactive controls without a dependency on a form library. Declare initial values and validators, then bind the controls to theme components.

<<< ../examples/FormExample.vue

The example assumes a backend POST endpoint `/api/app/product` accepting `{ name: string }`. Adapt the endpoint and DTO for your business service.

## Control and form state

`form.controls.name.value` is the field value directly. `form.value` is the current values object. These properties are not refs requiring a second `.value`.

| Method or state | Meaning |
| --- | --- |
| `validate()` | Validate all fields, mark them touched and return validity |
| `valid` / `invalid` | Current validation result |
| `dirty` / `touched` | Whether controls were edited or visited |
| `patch(values)` | Load values without marking the form dirty |
| `reset(values?)` | Reset values, interaction state and server errors |
| `setServerErrors(errors)` | Associate backend validation errors with fields |
| `unmatchedServerErrors` | Messages whose field cannot be matched |

## Backend rules

Generated proxy validator maps contain supported DTO annotations. Reuse the appropriate maps and compose inherited DTO rules where needed. Backend business validation remains authoritative.

`useValidationMessages` turns control errors into localized messages. `useServerValidation` connects backend validation reporting to the form. Display unmatched messages in the form or modal as well.

## Dialogs

Bind `form.dirty` and the saving state to `AbpModal`. Cancel should call the footer slot's `close()` so unsaved changes can be confirmed. Set visibility to false after a successful save. A failed save should keep values and the dialog open.
