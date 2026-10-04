<script setup>
import Example from "../examples/InputExample.vue";
</script>

# AbpInput

`AbpInput` edits a text or numeric value. Pair it with `AbpFormField` for a label, hint and validation messages.

## Bind different input types

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/InputExample.vue

The example includes a bounded text input, number, revealable password and textarea. Edit or clear Copies and inspect the displayed model.

## Model values

Text inputs emit strings. A number input emits a number, or `null` when emptied. Declare a compatible model rather than assuming every input produces a string. `type="textarea"` uses `rows`; `type="password"` with `revealable` adds the visibility control.

`min`, `max`, `step` and `maxlength` configure the native input. They do not replace business validators or backend validation. For a submit workflow, use [forms and validation](/utilities/forms).

## Labels, hints and errors

Bind all three values supplied by the field slot: `id`, `describedBy` and `invalid`. The id connects the label; `aria-describedby` connects hints and errors. When the control stands alone, supply `aria-label` or an external label linked to its id. Set `autocomplete` and `name` when relevant to browser autofill.

## Disabled or readonly

Disable a field when users should not interact during a request. Use readonly when the value should remain selectable and visible without editing. Neither state authorizes a request. The application decides whether the field is included in its DTO.

Listen to `blur` to mark a form control touched if errors should appear after leaving the field. `focus` and `blur` carry the native focus event. `invalid` changes accessibility and appearance; it does not calculate an error or render its text.

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpInput.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name              | Type                                    | Required | Default  |
| ----------------- | --------------------------------------- | -------- | -------- |
| `modelValue`      | `string \| number \| null \| undefined` | No       | —        |
| `type`            | `AbpInputType \| undefined`             | No       | `'text'` |
| `placeholder`     | `string \| undefined`                   | No       | —        |
| `disabled`        | `boolean \| undefined`                  | No       | —        |
| `readonly`        | `boolean \| undefined`                  | No       | —        |
| `invalid`         | `boolean \| undefined`                  | No       | —        |
| `id`              | `string \| undefined`                   | No       | —        |
| `name`            | `string \| undefined`                   | No       | —        |
| `autocomplete`    | `string \| undefined`                   | No       | —        |
| `rows`            | `number \| undefined`                   | No       | `3`      |
| `min`             | `number \| undefined`                   | No       | —        |
| `max`             | `number \| undefined`                   | No       | —        |
| `step`            | `number \| undefined`                   | No       | —        |
| `maxlength`       | `number \| undefined`                   | No       | —        |
| `revealable`      | `boolean \| undefined`                  | No       | —        |
| `ariaDescribedby` | `string \| undefined`                   | No       | —        |
| `ariaLabel`       | `string \| undefined`                   | No       | —        |

### Events

| Name                | Payload                             |
| ------------------- | ----------------------------------- |
| `update:modelValue` | `[value: string \| number \| null]` |
| `blur`              | `[event: FocusEvent]`               |
| `focus`             | `[event: FocusEvent]`               |

### Slots

No named slots.

<!-- component-contract:end -->
