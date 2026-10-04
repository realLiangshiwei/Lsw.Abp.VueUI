# AbpSelect

Single or multiple selection from typed options.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpSelect.vue)

## Usage

```vue
<AbpSelect v-model="category" :options="categories" clearable />
```

## Behavior

Each option has value and label; multiple selection uses an array. Labels are display text, so localize them before passing them.

## Props

| Name              | Type                                                       | Required | Default |
| ----------------- | ---------------------------------------------------------- | -------- | ------- |
| `modelValue`      | `AbpOptionValue \| readonly AbpOptionValue[] \| undefined` | No       | —       |
| `options`         | `readonly AbpOption[]`                                     | Yes      | —       |
| `multiple`        | `boolean \| undefined`                                     | No       | —       |
| `placeholder`     | `string \| undefined`                                      | No       | —       |
| `disabled`        | `boolean \| undefined`                                     | No       | —       |
| `readonly`        | `boolean \| undefined`                                     | No       | —       |
| `invalid`         | `boolean \| undefined`                                     | No       | —       |
| `clearable`       | `boolean \| undefined`                                     | No       | —       |
| `id`              | `string \| undefined`                                      | No       | —       |
| `name`            | `string \| undefined`                                      | No       | —       |
| `ariaDescribedby` | `string \| undefined`                                      | No       | —       |
| `ariaLabel`       | `string \| undefined`                                      | No       | —       |

## Events

| Name                | Payload                                       |
| ------------------- | --------------------------------------------- |
| `update:modelValue` | `[value: AbpOptionValue \| AbpOptionValue[]]` |

## Slots

| Name     | Context                                                          |
| -------- | ---------------------------------------------------------------- |
| `option` | `(context: { option: AbpOption; selected: boolean }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
