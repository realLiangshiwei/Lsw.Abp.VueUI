<script setup>
import Example from "../examples/SpinnerExample.vue";
</script>

# AbpSpinner

`AbpSpinner` shows an ongoing operation with a screen-reader label. It does not block input or own a request.

## Show only while working

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/SpinnerExample.vue

Put the spinner near the affected content, bind the content's `aria-busy` and give the spinner a specific label. Avoid an unlabeled icon that only communicates motion visually.

## Buttons and page loading

Use `AbpButton`'s `loading` prop for a save button; adding a separate spinner inside that button is usually unnecessary. For initial data loading, show a spinner and retain a distinct empty/error state. Hide it in `finally` or derive its visibility from the request status.

`size` changes the visual size. It does not add a full-screen mask, focus trap or reduced-motion setting. Disable affected commands separately when an operation cannot be repeated. See [request lifecycle](/utilities/requests).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpSpinner.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name      | Type                   | Required | Default |
| --------- | ---------------------- | -------- | ------- |
| `size`    | `AbpSize \| undefined` | No       | `'md'`  |
| `label`   | `string \| undefined`  | No       | —       |
| `overlay` | `boolean \| undefined` | No       | —       |

### Events

No component-specific events are declared.

### Slots

No named slots.

<!-- component-contract:end -->
