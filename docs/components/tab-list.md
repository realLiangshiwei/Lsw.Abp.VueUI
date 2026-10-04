<script setup>
import Example from "../examples/TabListExample.vue";
</script>

# AbpTabList

`AbpTabList` renders tab navigation. The enclosing page owns the selected name and panel content.

## Switch a panel

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/TabListExample.vue

Each tab has a stable `name`; its text is a localization key or a key with fallback text. The model holds the selected name, not an array index.

## Orientation and keyboard

The default orientation is vertical, suitable for settings beside a panel. Use horizontal for a compact group above content. Up/Down navigate vertical tabs; Left/Right navigate horizontal tabs with direction awareness. Home and End select the first and last tabs.

Initialize the model to a visible name. If permission changes remove the selected tab, choose another visible name in the page. A list with no selected item may leave every tab outside the normal tab order.

## Render the content

The component does not mount panels automatically. Render a corresponding region with an accessible name, as in the example. A custom label slot receives `{ item }`; retain meaningful text when adding badges or icons.

Use `v-if` to mount only the selected panel when every visit should reload its state. Use your own state/cache policy if unsaved edits must survive tab changes. For contributed profile/settings components and their services, see [profile and settings tabs](/customization/profile-settings).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpTabList.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name          | Type                                      | Required | Default      |
| ------------- | ----------------------------------------- | -------- | ------------ |
| `items`       | `readonly T[]`                            | Yes      | —            |
| `orientation` | `'vertical' \| 'horizontal' \| undefined` | No       | `'vertical'` |
| `ariaLabel`   | `string \| undefined`                     | No       | `undefined`  |
| `modelValue`  | `string`                                  | No       | `''`         |

### Events

| Name                | Payload           |
| ------------------- | ----------------- |
| `update:modelValue` | `[value: string]` |

### Slots

| Name    | Context                             |
| ------- | ----------------------------------- |
| `label` | `(context: { item: T }) => unknown` |

<!-- component-contract:end -->
