# Modal forms and unsaved changes

Use a modal for a short focused form. The page owns visibility, form values and the save request; the modal protects user-initiated closing and manages focus.

## Complete form example

The example assumes POST `/api/app/product` accepts `{ name: string }`. Register the theme and its confirmation host through your normal application layout.

<<< ../examples/ModalFormExample.vue

Place it in `src/components/ModalFormExample.vue` and render it from an application page. Provide the BookStore resource keys used for the title.

## Close paths

| Path | Behavior |
| --- | --- |
| Footer `close()`, header close, Escape, backdrop | Runs close protection |
| Unsaved input or `dirty: true` | Asks whether to discard |
| `busy: true` | Blocks user close requests |
| Save succeeds and page sets `visible = false` | Closes directly |
| Save fails | Page keeps modal and entered values |
| Component unmounts | Cleans up its pending confirmation and listeners |

Bind the footer cancel button to the scoped `close` function. Setting `visible = false` from Cancel bypasses the discard confirmation. Use direct assignment only for a completed operation or an intentional programmatic close.

Native input/change events inside the modal mark it dirty. `dirty` covers custom controls and programmatic edits that do not emit those events. It is combined with tracked input changes; setting `dirty` to false does not undo a native change in an already open modal.

`busy` protects closing; custom footer controls must also bind their disabled/loading state. It does not automatically disable arbitrary slot content.

## Suppress confirmation for one modal

~~~vue
<AbpModal
  v-model:visible="visible"
  :suppress-unsaved-changes-warning="true"
  aria-label="Preview"
>
  <p>{{ preview }}</p>
</AbpModal>
~~~

Here `visible` and `preview` are page-owned values. The flag suppresses unsaved-change warnings for this instance. It does not disable the busy close guard.

## Size and lifecycle

Use `size` to choose `sm`, `md`, `lg` or `xl`; the default is `md`. `centered` enables vertical centering. Put the title in the header slot, content in the default slot and actions in the footer.

`init` fires once per opening before the dialog enters the document. `appear` and `disappear` report visibility changes, not animation completion. Wrap common props in an application component when you need a consistent size or closing policy across your app.

## Navigation and focus

While an edited modal is open, browser page-unload protection can request confirmation. Closing protection is not a router-wide unsaved-form guard. A page that needs to prevent SPA navigation should add its own route-leave check.

The header names the dialog; when there is no header, supply `ariaLabel`. Keyboard focus returns to the trigger after closing. Test Escape, backdrop, cancel, a failed save and repeated open/close cycles.

[Modal props and slots](/components/modal), [forms](/utilities/forms) and [confirmation](/utilities/notifications) provide the contracts.
