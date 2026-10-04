# AbpToggle

A checkbox or switch.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToggle.vue)

## Usage

```vue
<AbpToggle v-model="enabled" variant="switch" aria-label="Enabled" />
```

## Behavior

Checkbox and switch variants bind a boolean. Radio controls bind the selected option value. `indeterminate` applies to the checkbox variant. The example uses a boolean switch.

## Props

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

## Events

| Name                | Payload                              |
| ------------------- | ------------------------------------ |
| `update:modelValue` | `[value: boolean \| AbpOptionValue]` |

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
