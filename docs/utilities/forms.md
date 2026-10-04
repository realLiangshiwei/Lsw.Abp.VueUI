# Forms and validation

Use `useAbpForm` to keep values, interaction state and validation together. A form is a flat set of controls; the current implementation does not provide nested form groups or dynamic arrays.

## Submit a real request

Create `src/pages/ProductForm.vue` from the following example. It assumes POST `/api/app/product` accepts `{ name: string }`; adapt that endpoint and DTO to your service. The application must already register core and a theme as described in [startup](/development/startup).

<<< ../examples/FormExample.vue

Try an empty submission, then a valid name. The handler marks every field touched, validates, prevents repeated submission, and only resets after success. A rejected request retains values.

## Values and interaction state

`form.controls.name.value` is the value directly, not another ref. `form.value` returns the current object. Do not destructure a primitive control value into a separate variable and expect it to stay reactive.

| Operation | Appropriate use |
| --- | --- |
| Write `control.value` | User edit; marks dirty and drops old server errors |
| `form.patch(values)` | Load values without marking dirty |
| `form.reset(values)` | Start a new editing baseline and clear touched/dirty/server errors |
| `control.markAsTouched()` | Show errors after blur |
| `form.validate()` | Mark all touched and return whether submission is valid |
| `form.clearServerErrors()` | Remove previous backend errors without changing values |

`patch` does not clear an existing dirty state. Use reset when opening a different record. For edit forms, retain fields absent from the UI, extra properties and the concurrency stamp when building the update DTO.

## Built-in rules

| Rule | Example |
| --- | --- |
| Required | `Validators.required()` |
| Length | `Validators.minLength(4)`, `Validators.maxLength(128)` |
| Numeric range | `Validators.min(1)`, `Validators.max(20)`, `Validators.range(1, 20)` |
| Format | `Validators.email()`, `Validators.url()`, `Validators.pattern(/\d{4}/)` |
| Match another field | `Validators.compare('password')` |

Optional empty values pass rules other than required. Required accepts false as a defined boolean, so accepting terms needs a rule requiring true. HTML min/max/maxlength are useful input constraints but do not replace validators. For a backend-generated DTO, reuse its generated validator map and explicitly compose inherited rules; it covers supported annotations, not arbitrary business logic.

## Custom and conditional rules

Create `src/forms/registration.ts` with these synchronous validators:

<<< ../examples/custom-validation.ts

A validator returns null or `{ rule, key, params }`. The context reads another control through `valueOf`. In the example, Company is required only for a business account and confirmation must match password. Bind the company control's visibility in the page separately; hiding a field does not automatically disable its validator.

Validators do not return Promises. For a remote uniqueness check, run a separate cancellable request and show its status, then let the backend enforce uniqueness on submission. Do not use a successful earlier lookup as authorization to save.

## Localized messages

Call `useValidationMessages()` once in setup, then convert errors inside computed values. This keeps their text reactive when culture changes. Every built-in validator accepts a final localization-message argument. Pass a resource key or a key with fallback text to override it. The [field example](/components/form-field) shows a custom required/email message and the touched-only display policy.

## Backend validation

Call `useServerValidation(form)` during setup before sending requests. It connects the form to framework validation handling. Backend members are matched case-insensitively and by the last path segment, so `Name` and `ExtraProperties.Name` can reach a `name` control. Display `unmatchedServerErrors` near the submit action; an error without a matching field must remain visible.

The framework's HTTP handlers report failures. A local catch can preserve the form without adding a duplicate generic error. If you disable global handling for a request, you must display its failure yourself. See [HTTP errors](/core/http-errors).

## Editing in a dialog

Load/reset before opening, bind `form.dirty` and saving to `AbpModal`, and call the footer's guarded close for Cancel. Keep the dialog open on failure. See [modal forms](/utilities/modals).

Check required, conditional, cross-field and backend errors, double submission, failed save, reset, and a language change. These are distinct behaviors; a green type check does not exercise a business endpoint.
