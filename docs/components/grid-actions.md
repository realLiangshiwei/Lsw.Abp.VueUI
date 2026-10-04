# AbpGridActions

Row actions displayed as one button or a dropdown.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpGridActions.vue)

## Usage

```vue
<AbpGridActions :record="book" :actions="actions" :disabled="saving" />
```

## Behavior

One action becomes a button; multiple actions become a dropdown; no actions render nothing. Plain RowAction.action receives the record. Filter actions by policy before passing them. Omit actions only inside an extensible module context.

## Props

| Name       | Type                                   | Required | Default     |
| ---------- | -------------------------------------- | -------- | ----------- |
| `record`   | `R`                                    | Yes      | —           |
| `index`    | `number \| undefined`                  | No       | `0`         |
| `actions`  | `readonly RowAction<R>[] \| undefined` | No       | `undefined` |
| `disabled` | `boolean \| undefined`                 | No       | `false`     |
| `text`     | `string \| undefined`                  | No       | `undefined` |

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/components)
