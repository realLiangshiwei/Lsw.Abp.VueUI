<script setup>
import Example from "../examples/ValidationExample.vue";
</script>

# AbpFormField

`AbpFormField` connects a label, hint and error list to one control. It does not own the value or run validators.

## Wire an accessible validated field

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/ValidationExample.vue

Submit an empty email, correct it, then Reset. The example's `useAbpForm` owns values and validation; the field only renders the resulting messages. An explicit blur handler marks the control touched.

## Slot wiring

The default slot provides `id`, `describedBy` and `invalid`. Bind them to the control's id, aria-describedby and invalid props. Omitting that wiring leaves a visually correct label that is not programmatically connected to its control.

`for` supplies a fixed id; otherwise the field creates one. Keep ids unique when repeating a field. `required` displays the required indication, but the actual validation rule belongs in the form. `disabled` describes field state; explicitly disable the child control too.

## Error timing and customization

Pass already localized strings to `errors`. A nonempty list marks the field invalid. A common policy is to show errors after touch or submission, as demonstrated. The `label`, `hint` and `errors` slots customize rendering; the errors slot receives the messages.

For backend errors, use [server validation](/utilities/forms). Show unmatched errors at form level so a rejected request always has visible feedback.

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpFormField.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name       | Type                             | Required | Default    |
| ---------- | -------------------------------- | -------- | ---------- |
| `label`    | `string \| undefined`            | No       | —          |
| `for`      | `string \| undefined`            | No       | —          |
| `required` | `boolean \| undefined`           | No       | —          |
| `hint`     | `string \| undefined`            | No       | —          |
| `errors`   | `readonly string[] \| undefined` | No       | `() => []` |
| `disabled` | `boolean \| undefined`           | No       | —          |

### Events

No component-specific events are declared.

### Slots

| Name      | Context                                               |
| --------- | ----------------------------------------------------- |
| `default` | `(context: AbpFormFieldContext) => unknown`           |
| `label`   | `() => unknown`                                       |
| `hint`    | `() => unknown`                                       |
| `errors`  | `(context: { errors: readonly string[] }) => unknown` |

<!-- component-contract:end -->
