# AbpDatePicker

Date, time or datetime input with ISO string values.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpDatePicker.vue)

## Usage

```vue
<AbpDatePicker v-model="publishDate" type="date" clearable />
```

## Behavior

Values remain strings for ABP DTOs. Basic Theme uses culture-aware date segments and a calendar. Respect min/max and choose date, time or datetime to match your DTO; displaying a date is separate from timezone conversion.

## Props

| Name              | Type                          | Required | Default  |
| ----------------- | ----------------------------- | -------- | -------- |
| `modelValue`      | `string \| null \| undefined` | No       | —        |
| `type`            | `AbpDateType \| undefined`    | No       | `'date'` |
| `min`             | `string \| null \| undefined` | No       | —        |
| `max`             | `string \| null \| undefined` | No       | —        |
| `placeholder`     | `string \| undefined`         | No       | —        |
| `disabled`        | `boolean \| undefined`        | No       | —        |
| `readonly`        | `boolean \| undefined`        | No       | —        |
| `invalid`         | `boolean \| undefined`        | No       | —        |
| `clearable`       | `boolean \| undefined`        | No       | —        |
| `id`              | `string \| undefined`         | No       | —        |
| `name`            | `string \| undefined`         | No       | —        |
| `ariaDescribedby` | `string \| undefined`         | No       | —        |
| `ariaLabel`       | `string \| undefined`         | No       | —        |

## Events

| Name                | Payload                   |
| ------------------- | ------------------------- |
| `update:modelValue` | `[value: string \| null]` |

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
