<script setup>
import Example from "../examples/NotificationHostsExample.vue";
</script>

# AbpConfirmHost

`AbpConfirmHost` renders the current question from `ConfirmationService`. It is also used for modal discard confirmation.

## Wait for an answer

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/NotificationHostsExample.vue

Only `ConfirmationStatus.confirm` permits the intended mutation. Cancel returns reject; closing with Esc or backdrop returns dismiss when allowed. Treat both as “do not proceed”, rather than using a truthiness check on the returned string.

## Host placement

The application layout supplies a confirmation host. Add one when using a custom shell or isolated view that has none, not once per nested component. The host and service must use the same injector so the question and answer belong to the same state.

## Configure a question

Use `warn`, `info`, `success`, `error` or `show` according to the meaning of the question. Options can set localized button texts, hide a button, specify an icon and disable backdrop/Esc dismissal. Give a meaningful message and title; interpolated record names belong in the localization parameters.

The service handles one question at a time. A new question dismisses the previous one; destroying its injector dismisses any pending question. Await the result before calling a delete API. Do not open an unrelated second confirmation from the first one's handler. See [modal closing](/components/modal) and [notifications](/utilities/notifications).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpConfirmHost.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

No component-specific props.

### Events

No component-specific events are declared.

### Slots

No named slots.

<!-- component-contract:end -->
