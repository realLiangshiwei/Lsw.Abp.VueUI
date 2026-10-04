# AbpToastHost

Renders notifications from ToasterService.

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToastHost.vue)

## Usage

```vue
<AbpToastHost />
```

## Behavior

Basic Theme installs its notification host in the application shell. Add a host when building your own shell; send messages through useToaster rather than manipulating the host.

## Props

| Name           | Type                  | Required | Default |
| -------------- | --------------------- | -------- | ------- |
| `containerKey` | `string \| undefined` | No       | —       |

## Events

No component-specific events. Native attributes/events follow the component's root element.

## Slots

No named slots.

Examples are template fragments: supply the named values and handlers in your page. Import controls from `@lsw-abpvue/theme-shared` and data/page components from `@lsw-abpvue/components`, or use the application template's auto-import preset. Types and models are extracted from the public contract; default expressions are from the current implementation. A dash means no explicit default is declared. Optional boolean props are normally false when omitted.

[Package API](/api/theme-shared)
