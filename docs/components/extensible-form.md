# AbpExtensibleForm

Fields assembled from form contributors.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpExtensibleForm.vue)

## Usage

```vue
<AbpExtensibleForm :form="form" :record="record">
  <template #field-name="{ control }"><AbpInput v-model="control.value" /></template>
</AbpExtensibleForm>
```

## Behavior

form is the result of useExtensibleForm. field-{name} replaces one control. Grouped properties render together, and unmatched server errors remain visible.

## Props

| Name     | Type                | Required | Default |
| -------- | ------------------- | -------- | ------- |
| `form`   | `ExtensibleForm<R>` | Yes      | —       |
| `record` | `R \| undefined`    | No       | —       |

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

| Name              | Context                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `field-${string}` | `(props: { prop: FormProp<R>; control: AbpFormControl }) => unknown` |

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/components)
