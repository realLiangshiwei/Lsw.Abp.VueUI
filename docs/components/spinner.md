# AbpSpinner

An accessible loading indicator.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpSpinner.vue)

## Usage

```vue
<AbpSpinner label="Loading records" size="sm" />
```

## Behavior

Use a useful label. A spinner does not disable other controls; bind their busy or disabled state separately.

## Props

| Name      | Type                   | Required | Default |
| --------- | ---------------------- | -------- | ------- |
| `size`    | `AbpSize \| undefined` | No       | `'md'`  |
| `label`   | `string \| undefined`  | No       | —       |
| `overlay` | `boolean \| undefined` | No       | —       |

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
