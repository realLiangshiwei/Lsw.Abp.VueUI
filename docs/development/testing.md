# Testing an application

Test your business behavior alongside the generated frontend. Use the same providers as the application, with a separate test backend and data.

## Choose the level

| Level | Useful checks |
| --- | --- |
| Type checking | DTO changes, component props, typed service calls |
| Component tests | Field errors, busy controls, permission-dependent actions, modal cancellation |
| Backend integration | Query parameters, tenant headers, validation and concurrency errors |
| Browser tests | Login redirect, callback, CRUD, My account and logout |

Run the generated project's type check and production build before deploying. Inspect `package.json` for the scripts available in your template version.

## Authentication and isolation

Browser tests should use a dedicated test account and a backend configured for the frontend's origin. Let login and logout follow the selected authentication flow. Do not make tests depend on another browser tab's session.

Create records with identifiable names and remove the records you created. Exercise both an authorized user and a user without the required permission. UI visibility checks supplement the backend's authorization tests.

## Reference examples

The documentation's complete examples are stored in `docs/examples` and checked with `vue-tsc`. Component reference pages are extracted from public contracts and implementation defaults. Small fragments in other pages show one API in context; supply your application's values and handlers when using them.
