<script setup>
import Example from "../examples/ModalExample.vue";
</script>

# AbpModal

`AbpModal` presents an editing task while protecting unsaved changes. Basic Theme provides a dialog, focus management and a confirmation step for guarded cancellation.

## Edit, save and cancel

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/ModalExample.vue

Change the title and press Cancel, Esc or the close button to exercise the discard confirmation. Save waits 800 ms and commits local state. The demonstration includes its own confirmation host; the application layout already supplies one.

For a real request with validation, copy the [modal form example](/utilities/modals). It keeps the dialog and entered values when saving fails.

## Close paths

| Action                      | Behavior                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| Footer `close()`            | Requests guarded cancellation                                    |
| Close button, Esc, backdrop | Requests guarded cancellation                                    |
| Set `visible = false`       | Application-controlled close, bypasses cancellation confirmation |
| Any user close while `busy` | Blocked                                                          |

Use `close()` for a cancel button. Set visibility false directly after successful persistence. Using `visible = false` on Cancel would discard changes without the intended guard.

## Dirty and busy

Native input changes are tracked inside the dialog. Also bind `dirty` for custom controls or state changed outside native inputs. Reset/load the form before reopening. Dirty means the edit must be considered for cancellation; it does not guarantee a field is valid.

`busy` protects user close paths. Bind loading/disabled on controls in custom slots as well. `suppress-unsaved-changes-warning` skips the discard question for a task where that behavior is intentional; it does not skip a busy guard.

## Layout and accessibility

Use `size="lg"` or `xl` for a wide form and `centered` for vertical centering. Put a meaningful heading in `header`, or supply `aria-label` when there is no header. The dialog keeps focus inside and restores it on close. Avoid independent nested edit dialogs; a confirmation host can handle the discard question.

`init`, `appear` and `disappear` describe the visibility lifecycle. They are not notifications that a CSS animation has finished. Load initial records in your own page workflow before showing the editable form.

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpModal.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name                            | Type                                        | Required | Default |
| ------------------------------- | ------------------------------------------- | -------- | ------- |
| `visible`                       | `boolean`                                   | Yes      | —       |
| `busy`                          | `boolean \| undefined`                      | No       | —       |
| `size`                          | `'sm' \| 'md' \| 'lg' \| 'xl' \| undefined` | No       | `'md'`  |
| `centered`                      | `boolean \| undefined`                      | No       | —       |
| `dirty`                         | `boolean \| undefined`                      | No       | —       |
| `suppressUnsavedChangesWarning` | `boolean \| undefined`                      | No       | —       |
| `ariaLabel`                     | `string \| undefined`                       | No       | —       |

### Events

| Name             | Payload            |
| ---------------- | ------------------ |
| `update:visible` | `[value: boolean]` |
| `init`           | `[]`               |
| `appear`         | `[]`               |
| `disappear`      | `[]`               |

### Slots

| Name      | Context                                                |
| --------- | ------------------------------------------------------ |
| `header`  | `() => unknown`                                        |
| `default` | `() => unknown`                                        |
| `footer`  | `(context: { close: () => Promise<void> }) => unknown` |

<!-- component-contract:end -->
