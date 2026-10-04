# Notifications and confirmation

Use the theme-shared services so notifications work with the selected theme. Basic Theme layouts provide the toast and confirmation hosts; a custom shell must render them.

<<< ../examples/NotificationExample.vue

## Toasts

`useToaster()` exposes `info`, `success`, `warn`, `error` and `show`. Calls return a toast id for `remove(id)`; `clear(containerKey?)` removes a group.

The default lifetime is 5000 ms. `life: 0` keeps a notification until removed, while `sticky` prevents automatic expiry. Use `closable` and `containerKey` to control dismissal and placement. Messages and titles accept localization parameters.

## Confirmation

`useConfirmation()` exposes the same severity methods and returns a promise of `ConfirmationStatus`. Proceed only on `ConfirmationStatus.confirm`. Cancel, close and dismissal are distinct non-confirming results.

Only one confirmation is current at a time; opening another settles the previous one. Pass labels and other presentation options through the service instead of binding directly to a specific theme's dialog.

## Choosing feedback

Use field errors for invalid input, a toast for a completed action, and confirmation before an operation that needs a deliberate decision. HTTP handlers already report unhandled request failures, so add custom reporting only when your caller takes ownership of that error.
