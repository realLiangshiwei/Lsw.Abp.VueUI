# AbpFormField

A label, validation messages and help text around a control.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpFormField.vue)

## Usage

```vue
<AbpFormField label="Name" for="name" :errors="messages">
  <AbpInput id="name" v-model="name" />
</AbpFormField>
```

## Behavior

Use the same for and id. Pass already formatted validation messages in errors; do not pass validation rule objects.

## Props

| Name       | Type                             | Required | Default    |
| ---------- | -------------------------------- | -------- | ---------- |
| `label`    | `string \| undefined`            | No       | —          |
| `for`      | `string \| undefined`            | No       | —          |
| `required` | `boolean \| undefined`           | No       | —          |
| `hint`     | `string \| undefined`            | No       | —          |
| `errors`   | `readonly string[] \| undefined` | No       | `() => []` |
| `disabled` | `boolean \| undefined`           | No       | —          |

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

| Name      | Context                                               |
| --------- | ----------------------------------------------------- |
| `default` | `(context: AbpFormFieldContext) => unknown`           |
| `label`   | `() => unknown`                                       |
| `hint`    | `() => unknown`                                       |
| `errors`  | `(context: { errors: readonly string[] }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
