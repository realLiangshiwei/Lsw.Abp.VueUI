<script setup>
import Example from "../examples/ToggleExample.vue";
</script>

# AbpToggle

Use `AbpToggle` for a boolean choice or a radio group.

## Checkbox, switch and radio

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/ToggleExample.vue

The checkbox and switch bind booleans. A radio group binds one of its option values. Labels and option labels are already localized, so compute them from your localization service when language changes must update them.

## Choosing the control

A checkbox suits acceptance or selection; a switch suits enabling a setting. Radio buttons suit a small set of mutually exclusive choices that should stay visible. Use [Select](/components/select) for a longer list.

`indeterminate` is a visual mixed state for a checkbox, such as some selected rows. It is not a third persisted boolean value. Keep the actual selection state in the page and calculate the mixed state from it.

## Forms and accessibility

Supply `label` or `aria-label`, particularly for a toggle in a table. Bind `disabled` while saving and `invalid` when the field has a validation message. The toggle emits `update:modelValue`; it does not save a setting automatically.

If acceptance is mandatory, `Validators.required()` alone is insufficient: `false` is a defined value. Add a custom validator that requires true, and enforce the same rule on the backend. See [validation](/utilities/forms).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToggle.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name              | Type                                             | Required | Default      |
| ----------------- | ------------------------------------------------ | -------- | ------------ |
| `modelValue`      | `boolean \| AbpOptionValue \| undefined`         | No       | —            |
| `variant`         | `'checkbox' \| 'switch' \| 'radio' \| undefined` | No       | `'checkbox'` |
| `label`           | `string \| undefined`                            | No       | —            |
| `options`         | `readonly AbpOption[] \| undefined`              | No       | —            |
| `disabled`        | `boolean \| undefined`                           | No       | —            |
| `readonly`        | `boolean \| undefined`                           | No       | —            |
| `invalid`         | `boolean \| undefined`                           | No       | —            |
| `indeterminate`   | `boolean \| undefined`                           | No       | —            |
| `id`              | `string \| undefined`                            | No       | —            |
| `name`            | `string \| undefined`                            | No       | —            |
| `ariaDescribedby` | `string \| undefined`                            | No       | —            |
| `ariaLabel`       | `string \| undefined`                            | No       | —            |

### Events

| Name                | Payload                              |
| ------------------- | ------------------------------------ |
| `update:modelValue` | `[value: boolean \| AbpOptionValue]` |

### Slots

No named slots.

<!-- component-contract:end -->
