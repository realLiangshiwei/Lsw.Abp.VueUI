<script setup>
import Example from "../examples/DatePickerExample.vue";
</script>

# AbpDatePicker

`AbpDatePicker` edits a date, time or local date-time using the theme's calendar and input UI.

## Three kinds of values

<ClientOnly><DocsDemo :example="Example" note="This example uses local data and does not contact a business server." /></ClientOnly>

<<< ../examples/DatePickerExample.vue

Open the publication calendar, clear a date, and edit the time segments. The output shows the actual model strings.

| Type       | Model example      | Meaning                                |
| ---------- | ------------------ | -------------------------------------- |
| `date`     | `2026-10-04`       | Calendar date, without timezone        |
| `time`     | `09:30`            | Time of day, without a date            |
| `datetime` | `2026-10-04T09:30` | Local date and time, without an offset |

The model is a string or null, not a `Date`. The displayed form follows the current culture. Localized display and the API representation are separate concerns.

## Limits and editing

Use `min` and `max` strings in the same format as the field type. Use `clearable` for an optional value, and a required validator when clearing should prevent save. `readonly` prevents editing; disabled also blocks interaction while loading. Bind the field's id and error attributes as with [AbpInput](/components/input).

## Sending an instant to the backend

A date-only birthday or publication date should normally stay a date-only string. An appointment representing an instant needs an explicit timezone rule. Do not append `Z` to a local value: that labels local wall time as UTC without converting it. Convert according to your application's chosen timezone and DTO before saving.

This control does not choose a timezone or perform business date conversion. See [dates and timezone](/utilities/dates) for display and request-header behavior.

<!-- component-contract:start -->

## Props, events and slots

[Source](https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/packages/theme-basic/src/components/AbpDatePicker.vue)

Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.

### Props

| Name              | Type                          | Required | Default  |
| ----------------- | ----------------------------- | -------- | -------- |
| `modelValue`      | `string \| null \| undefined` | No       | —        |
| `type`            | `AbpDateType \| undefined`    | No       | `'date'` |
| `min`             | `string \| null \| undefined` | No       | —        |
| `max`             | `string \| null \| undefined` | No       | —        |
| `placeholder`     | `string \| undefined`         | No       | —        |
| `disabled`        | `boolean \| undefined`        | No       | —        |
| `readonly`        | `boolean \| undefined`        | No       | —        |
| `invalid`         | `boolean \| undefined`        | No       | —        |
| `clearable`       | `boolean \| undefined`        | No       | —        |
| `id`              | `string \| undefined`         | No       | —        |
| `name`            | `string \| undefined`         | No       | —        |
| `ariaDescribedby` | `string \| undefined`         | No       | —        |
| `ariaLabel`       | `string \| undefined`         | No       | —        |

### Events

| Name                | Payload                   |
| ------------------- | ------------------------- |
| `update:modelValue` | `[value: string \| null]` |

### Slots

No named slots.

<!-- component-contract:end -->
