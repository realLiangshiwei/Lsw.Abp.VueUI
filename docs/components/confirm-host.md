# AbpConfirmHost

Renders pending ConfirmationService requests.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpConfirmHost.vue)

## Usage

```vue
<AbpConfirmHost />
```

## Behavior

Basic Theme provides a host. useConfirmation().warn() resolves to ConfirmationStatus; compare the result with ConfirmationStatus.confirm before a destructive operation.

## Props

No component-specific props.

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
