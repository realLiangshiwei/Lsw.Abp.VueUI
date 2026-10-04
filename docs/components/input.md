# AbpInput

A themed input, textarea or password field.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpInput.vue)

## Usage

```vue
<AbpInput v-model="name" autocomplete="name" :invalid="invalid" />
```

## Behavior

Use type="number" for numeric values. Text inputs emit strings; clearing a numeric input can emit null. Connect labels through AbpFormField.

## Props

| Name              | Type                                    | Required | Default  |
| ----------------- | --------------------------------------- | -------- | -------- |
| `modelValue`      | `string \| number \| null \| undefined` | No       | —        |
| `type`            | `AbpInputType \| undefined`             | No       | `'text'` |
| `placeholder`     | `string \| undefined`                   | No       | —        |
| `disabled`        | `boolean \| undefined`                  | No       | —        |
| `readonly`        | `boolean \| undefined`                  | No       | —        |
| `invalid`         | `boolean \| undefined`                  | No       | —        |
| `id`              | `string \| undefined`                   | No       | —        |
| `name`            | `string \| undefined`                   | No       | —        |
| `autocomplete`    | `string \| undefined`                   | No       | —        |
| `rows`            | `number \| undefined`                   | No       | `3`      |
| `min`             | `number \| undefined`                   | No       | —        |
| `max`             | `number \| undefined`                   | No       | —        |
| `step`            | `number \| undefined`                   | No       | —        |
| `maxlength`       | `number \| undefined`                   | No       | —        |
| `revealable`      | `boolean \| undefined`                  | No       | —        |
| `ariaDescribedby` | `string \| undefined`                   | No       | —        |
| `ariaLabel`       | `string \| undefined`                   | No       | —        |

## Events

| Name                | Payload                             |
| ------------------- | ----------------------------------- |
| `update:modelValue` | `[value: string \| number \| null]` |
| `blur`              | `[event: FocusEvent]`               |
| `focus`             | `[event: FocusEvent]`               |

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
