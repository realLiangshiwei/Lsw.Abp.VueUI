<script setup>
import Example from "../examples/NotificationHostsExample.vue";
</script>

# AbpToastHost

`AbpToastHost` renders notifications created through `ToasterService`. A service call alone cannot display a toast without a matching mounted host.

## Display and route a toast

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/NotificationHostsExample.vue

The toast uses `containerKey: 'example'`; the host uses the matching `container-key`. A default application layout already mounts a default host. Do not add another default host inside each page, or messages can appear twice.

## Lifetime and ownership

Use `life` for an automatic timeout, or `sticky` for a message that stays until dismissed. `closable` and `tapToDismiss` configure dismissal. A supplied id lets the caller refer to its toast; keep ids stable only when that is intentional.

Messages and titles are localization parameters; interpolation values go in `messageLocalizationParams` or `titleLocalizationParams`. Use a toast for brief operation feedback and a [page alert](/utilities/page-alerts) for a persistent problem near the affected content.

An error toast is not a backend validation binding. Show field errors in the form and avoid reporting a handled HTTP failure twice. See [notifications](/utilities/notifications) and [HTTP errors](/core/http-errors).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpToastHost.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name           | Type                  | Required | Default |
| -------------- | --------------------- | -------- | ------- |
| `containerKey` | `string \| undefined` | No       | —       |

### Events

No component-specific events are declared.

### Slots

No named slots.

<!-- component-contract:end -->
