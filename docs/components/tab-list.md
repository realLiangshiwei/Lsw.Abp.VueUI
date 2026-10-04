# AbpTabList

Accessible tabs with horizontal or vertical orientation.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpTabList.vue)

## Usage

```vue
<AbpTabList v-model="selected" :items="tabs" orientation="horizontal" aria-label="Settings" />
```

## Behavior

Items use name, optional text and iconClass. text/name are localized. The caller renders the selected panel. Arrow keys and Home/End move selection.

## Props

| Name          | Type                                      | Required | Default      |
| ------------- | ----------------------------------------- | -------- | ------------ |
| `items`       | `readonly T[]`                            | Yes      | —            |
| `orientation` | `'vertical' \| 'horizontal' \| undefined` | No       | `'vertical'` |
| `ariaLabel`   | `string \| undefined`                     | No       | `undefined`  |
| `modelValue`  | `string`                                  | No       | `''`         |

## Events

| Name                | Payload           |
| ------------------- | ----------------- |
| `update:modelValue` | `[value: string]` |

## Slots

| Name    | Context                             |
| ------- | ----------------------------------- |
| `label` | `(context: { item: T }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/components)
