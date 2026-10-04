# AbpTypeahead

An asynchronous lookup with separate value and display text.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpTypeahead.vue)

## Usage

```vue
<AbpTypeahead v-model="authorId" v-model:display-value="authorName" :search="searchAuthors" />
```

## Behavior

search returns value/label items and receives an AbortSignal. Respect it in your request. displayValue fills an existing record without another lookup. Basic Theme currently uses its existing typeahead implementation; the reka-ui migration is planned.

## Props

| Name              | Type                                                                          | Required | Default |
| ----------------- | ----------------------------------------------------------------------------- | -------- | ------- |
| `modelValue`      | `AbpOptionValue \| undefined`                                                 | No       | —       |
| `displayValue`    | `string \| undefined`                                                         | No       | `''`    |
| `search`          | `(term: string, signal: AbortSignal) => Promise<readonly AbpTypeaheadItem[]>` | Yes      | —       |
| `debounce`        | `number \| undefined`                                                         | No       | `300`   |
| `minLength`       | `number \| undefined`                                                         | No       | `1`     |
| `placeholder`     | `string \| undefined`                                                         | No       | —       |
| `disabled`        | `boolean \| undefined`                                                        | No       | —       |
| `readonly`        | `boolean \| undefined`                                                        | No       | —       |
| `invalid`         | `boolean \| undefined`                                                        | No       | —       |
| `clearable`       | `boolean \| undefined`                                                        | No       | —       |
| `id`              | `string \| undefined`                                                         | No       | —       |
| `name`            | `string \| undefined`                                                         | No       | —       |
| `ariaDescribedby` | `string \| undefined`                                                         | No       | —       |
| `ariaLabel`       | `string \| undefined`                                                         | No       | —       |

## Events

| Name                  | Payload                            |
| --------------------- | ---------------------------------- |
| `update:modelValue`   | `[value: AbpOptionValue]`          |
| `update:displayValue` | `[value: string]`                  |
| `select`              | `[item: AbpTypeaheadItem \| null]` |

## Slots

| Name    | Context                                                             |
| ------- | ------------------------------------------------------------------- |
| `item`  | `(context: { item: AbpTypeaheadItem; active: boolean }) => unknown` |
| `empty` | `() => unknown`                                                     |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
