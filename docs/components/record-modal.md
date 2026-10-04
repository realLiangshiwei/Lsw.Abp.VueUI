# AbpRecordModal

A dialog view of an extensible module record editor.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpRecordModal.vue)

## Usage

```vue
<AbpRecordModal :editor="editor" label="AbpIdentity::Roles" create-title="AbpIdentity::NewRole" />
```

## Behavior

editor comes from useRecordEditor in a reusable module. The default body renders the extensible form; header/body/footer can be replaced. Application CRUD pages use AbpModal with their own form and save method.

## Props

| Name          | Type                                        | Required | Default |
| ------------- | ------------------------------------------- | -------- | ------- |
| `editor`      | `RecordEditor<R>`                           | Yes      | —       |
| `label`       | `LocalizationParam`                         | Yes      | —       |
| `createTitle` | `LocalizationParam`                         | Yes      | —       |
| `editTitle`   | `LocalizationParam \| undefined`            | No       | —       |
| `size`        | `'sm' \| 'md' \| 'lg' \| 'xl' \| undefined` | No       | —       |
| `save`        | `(() => void) \| undefined`                 | No       | —       |

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

| Name      | Context                                                |
| --------- | ------------------------------------------------------ |
| `default` | `() => unknown`                                        |
| `header`  | `() => unknown`                                        |
| `footer`  | `(context: { close: () => Promise<void> }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/components)
