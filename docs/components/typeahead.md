<script setup>
import Example from "../examples/TypeaheadExample.vue";
</script>

# AbpTypeahead

Use `AbpTypeahead` for an author, user or other lookup whose choices are searched on demand.

## Value and display text

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/TypeaheadExample.vue

The model stores the author id while `displayValue` stores the name. An edit form can provide both immediately; it does not need a lookup request just to show a name already returned by the record API.

## Connect the Identity users API

Create `src/pages/UserAssignmentPage.vue` from this example. Keep Core, OAuth, the router and Basic Theme providers, and install Identity so its `/proxy` entry is available. The backend must expose the Identity users API and grant the signed-in caller `AbpIdentity.Users`. No custom author endpoint is assumed.

<<< ../examples/RemoteUserLookup.vue

Register `/user-assignment` in the existing route array, using the component import and `requiresAuthentication: true` metadata. The example preselects the current user to demonstrate editing: in a business editor, replace initialUserId with the id returned by its detail DTO. If that DTO already contains a label, set both models directly and skip the lookup request.

The search callback sends filter, skipCount and maxResultCount through IdentityUserService. It forwards the control's signal and maps the backend's IdentityUserDto to options. Only the id belongs in a save DTO; displayValue is presentation text.

A failed lookup shows a retry state. A failed search is distinguished in the empty slot from a successful empty result. The callback returns a resolved list after RestService reports failure because the control expects that contract; aborted work is ignored. It does not turn a failure into a successful assignment.

## Request lifecycle

`minLength` defaults to 1 and `debounce` to 300 ms. Shorter input does not search; another term or disposal cancels obsolete work. A request must respect the signal to release network work promptly. A search failure is not the same as an empty successful result; let the request/error layer report it.

## Custom results

The `item` slot receives `item` and `active`. The `empty` slot explains a successful search with no matches. Keep options keyboard-selectable and avoid nested links or buttons. The separate `select` event carries the item, or null when cleared, if the page needs to fill related state.

Clearing a required lookup should be caught by form validation. Do not store the display label as the backend id. See [request lifecycle](/utilities/requests) and [forms](/utilities/forms).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpTypeahead.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name              | Type                                                                          | Required | Default |
| ----------------- | ----------------------------------------------------------------------------- | -------- | ------- |
| `modelValue`      | `AbpOptionValue \| undefined`                                                 | No       | —       |
| `displayValue`    | `string \| undefined`                                                         | No       | `''`    |
| `search`          | `(term: string, signal: AbortSignal) => Promise<readonly AbpTypeaheadItem[]>` | Yes      | —       |
| `debounce`        | `number \| undefined`                                                         | No       | `300`   |
| `minLength`       | `number \| undefined`                                                         | No       | `1`     |
| `placeholder`     | `string \| undefined`                                                         | No       | —       |
| `disabled`        | `boolean \| undefined`                                                        | No       | —       |
| `readonly`        | `boolean \| undefined`                                                        | No       | —       |
| `invalid`         | `boolean \| undefined`                                                        | No       | —       |
| `clearable`       | `boolean \| undefined`                                                        | No       | —       |
| `id`              | `string \| undefined`                                                         | No       | —       |
| `name`            | `string \| undefined`                                                         | No       | —       |
| `ariaDescribedby` | `string \| undefined`                                                         | No       | —       |
| `ariaLabel`       | `string \| undefined`                                                         | No       | —       |

### Events

| Name                  | Payload                            |
| --------------------- | ---------------------------------- |
| `update:modelValue`   | `[value: AbpOptionValue]`          |
| `update:displayValue` | `[value: string]`                  |
| `select`              | `[item: AbpTypeaheadItem \| null]` |

### Slots

| Name    | Context                                                             |
| ------- | ------------------------------------------------------------------- |
| `item`  | `(context: { item: AbpTypeaheadItem; active: boolean }) => unknown` |
| `empty` | `() => unknown`                                                     |

<!-- component-contract:end -->
