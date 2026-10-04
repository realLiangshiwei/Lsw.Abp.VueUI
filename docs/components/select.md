<script setup>
import Example from "../examples/SelectExample.vue";
</script>

# AbpSelect

`AbpSelect` chooses from a known list of options. Use a typeahead when choices need a remote search.

## Single and multiple selection

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/SelectExample.vue

The first control has a placeholder and clear command; the second allows several categories. Archived is disabled. The custom option slot adds a check mark while keeping a plain label for the trigger.

## Options and values

Each `AbpOption` has `value` and `label`, with optional `disabled` and `group`. Labels are already localized text: build options with a computed value if their labels must change with language. Values can be string, number, boolean or null; keep the same type in the model and options. Numeric `1` and string `'1'` are different choices.

Single selection stores one value. `multiple` stores an array; initialize it to `[]`. `clearable` exposes clearing, producing an empty selection. A placeholder describes the absence of a selection; it is not a selectable business value.

## Loading options

The component receives options; it does not fetch them. Load through a generated service or `RestService`, show a separate loading state and disable interaction until the initial choices are ready. When editing, include the currently selected value in the available choices so its label can be resolved. Do not erase a stored value just because a request failed.

## Customized rendering and keyboard use

The `option` slot receives `{ option, selected }`. Preserve the label's meaning and avoid nested buttons inside a choice. Users can open and navigate the menu with the keyboard. Connect labels/errors through `AbpFormField` as shown in the [input guide](/components/input).

For remote authors or large catalogues, see [typeahead](/components/typeahead).

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpSelect.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name              | Type                                                       | Required | Default |
| ----------------- | ---------------------------------------------------------- | -------- | ------- |
| `modelValue`      | `AbpOptionValue \| readonly AbpOptionValue[] \| undefined` | No       | —       |
| `options`         | `readonly AbpOption[]`                                     | Yes      | —       |
| `multiple`        | `boolean \| undefined`                                     | No       | —       |
| `placeholder`     | `string \| undefined`                                      | No       | —       |
| `disabled`        | `boolean \| undefined`                                     | No       | —       |
| `readonly`        | `boolean \| undefined`                                     | No       | —       |
| `invalid`         | `boolean \| undefined`                                     | No       | —       |
| `clearable`       | `boolean \| undefined`                                     | No       | —       |
| `id`              | `string \| undefined`                                      | No       | —       |
| `name`            | `string \| undefined`                                      | No       | —       |
| `ariaDescribedby` | `string \| undefined`                                      | No       | —       |
| `ariaLabel`       | `string \| undefined`                                      | No       | —       |

### Events

| Name                | Payload                                       |
| ------------------- | --------------------------------------------- |
| `update:modelValue` | `[value: AbpOptionValue \| AbpOptionValue[]]` |

### Slots

| Name     | Context                                                          |
| -------- | ---------------------------------------------------------------- |
| `option` | `(context: { option: AbpOption; selected: boolean }) => unknown` |

<!-- component-contract:end -->
