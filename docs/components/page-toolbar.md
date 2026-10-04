# AbpPageToolbar

Renders contributed toolbar actions in reusable module pages.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/components/src/components/AbpPageToolbar.vue)

## Usage

```vue
<AbpPageToolbar :data="items" />
```

## Behavior

Requires an extension identifier and assembled toolbar contributors. Application pages can place ordinary buttons in AbpPage's toolbar slot instead.

## Props

| Name   | Type                        | Required | Default    |
| ------ | --------------------------- | -------- | ---------- |
| `data` | `readonly R[] \| undefined` | No       | `() => []` |

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/components)
