<script setup>
import Example from "../examples/GridActionsExample.vue";
</script>

# AbpGridActions

`AbpGridActions` keeps row commands compact: multiple actions use a dropdown, one uses a button, and an empty list renders no control.

## Explicit application actions

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/GridActionsExample.vue

The example performs only local feedback. Its `RowAction<Book>.action` receives the record directly. Supply your generated service or page command in the callback when connecting a backend.

## Permission and visibility

With explicit `actions`, the caller builds the allowed list. Filter by the current permission and record state before passing it. `disabled` blocks the entire control; an action's `disabled` blocks just that choice. Client visibility does not replace endpoint authorization.

When `actions` is omitted, the component reads entity-action contributors using the enclosing extension identifier. Those callbacks receive `PropData`, including `record` and `getInjected`, rather than the direct record used above. See [entity action extensions](/customization/entity-actions).

## Confirmation and asynchronous work

Delete is not automatically confirmed. Ask `ConfirmationService`, check for `ConfirmationStatus.confirm`, await the service call and reload the list only on success. A returned Promise does not automatically disable all actions: keep a busy state in your page command and bind it to `disabled` to prevent repeated mutations.

## Menu behavior

The menu is positioned against the viewport so the table's horizontal scroller does not clip it. It closes on scrolling or resizing. Esc closes it and returns focus to its trigger. A single icon-only action needs a meaningful `text` and `showOnlyIcon`; the localized text supplies its accessible name.

Keep action labels as stable localization keys in production. See [notifications and confirmation](/utilities/notifications).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpGridActions.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name       | Type                                   | Required | Default     |
| ---------- | -------------------------------------- | -------- | ----------- |
| `record`   | `R`                                    | Yes      | —           |
| `index`    | `number \| undefined`                  | No       | `0`         |
| `actions`  | `readonly RowAction<R>[] \| undefined` | No       | `undefined` |
| `disabled` | `boolean \| undefined`                 | No       | `false`     |
| `text`     | `string \| undefined`                  | No       | `undefined` |

### Events

No component-specific events are declared.

### Slots

No named slots.

<!-- component-contract:end -->
