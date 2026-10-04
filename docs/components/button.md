<script setup>
import Example from "../examples/ButtonExample.vue";
</script>

# AbpButton

Use `AbpButton` for commands in a page or dialog. It follows the selected theme and renders a native button, with loading, disabled, size and icon states.

## Save without repeated clicks

Copy this component into a page. Click Save to see the loading state; the example updates local state after an 800 ms delay. Replace that delay with the application's request.

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/ButtonExample.vue

## Choose a variant

Use `variant="primary"` for the main command, `secondary` for cancellation, and `danger` for destructive commands. `outline` keeps the same semantic color with an outlined surface. `size="sm"` fits a toolbar; `lg` fits a prominent entry point. `block` fills the available width.

The default button type is `button`. Inside a form, set `type="submit"` and handle the form's `submit` event. This also lets Enter submit from an input. Keep the save guard in the handler because code can call it independently of a click.

## Loading and failures

`loading` displays a spinner, disables the native button and sets `aria-busy`. `disabled` prevents the command without showing progress. Reset loading in `finally`; only clear form values after a successful request. The button does not start requests, report failures or confirm deletions itself.

## Icons and labels

Use `icon-class="bi bi-plus"` with Bootstrap Icons, or the `icon` slot for your own icon. Keep decorative icons hidden from screen readers. An icon-only button needs `aria-label`; a tooltip alone is not an accessible name. The default label stays visible during loading. A custom icon slot controls its own loading appearance.

See [form submission](/utilities/forms), [confirmations](/utilities/notifications) and [page toolbars](/components/page-toolbar).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpButton.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name        | Type                                                                                                                   | Required | Default     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| `type`      | `'button' \| 'submit' \| 'reset' \| undefined`                                                                         | No       | `'button'`  |
| `variant`   | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'light' \| 'dark' \| 'link' \| undefined` | No       | `'primary'` |
| `size`      | `AbpSize \| undefined`                                                                                                 | No       | `'md'`      |
| `outline`   | `boolean \| undefined`                                                                                                 | No       | —           |
| `loading`   | `boolean \| undefined`                                                                                                 | No       | —           |
| `disabled`  | `boolean \| undefined`                                                                                                 | No       | —           |
| `iconClass` | `string \| undefined`                                                                                                  | No       | —           |
| `block`     | `boolean \| undefined`                                                                                                 | No       | —           |
| `ariaLabel` | `string \| undefined`                                                                                                  | No       | —           |

### Events

| Name    | Payload               |
| ------- | --------------------- |
| `click` | `[event: MouseEvent]` |

### Slots

| Name      | Context         |
| --------- | --------------- |
| `default` | `() => unknown` |
| `icon`    | `() => unknown` |

<!-- component-contract:end -->
