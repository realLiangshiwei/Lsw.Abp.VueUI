<script setup lang="ts">
import { useConfigState } from '@lsw-abpvue/core';
import {
  parseDate,
  parseDateTime,
  parseTime,
  type DateValue,
  type Time,
} from '@internationalized/date';
import type { AbpDatePickerEmits, AbpDatePickerProps } from '@lsw-abpvue/theme-shared';
import {
  DatePickerRoot,
  DatePickerField,
  DatePickerInput,
  DatePickerTrigger,
  DatePickerContent,
  DatePickerCalendar,
  DatePickerHeading,
  DatePickerPrev,
  DatePickerNext,
  DatePickerGrid,
  DatePickerHeadCell,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerAnchor,
  PopoverPortal,
  TimeFieldRoot,
  TimeFieldInput,
} from 'reka-ui';
import { computed, ref } from 'vue';
import { orderedDateSegments } from '../utils/date-segments.js';
import { defined } from '../utils/defined.js';

const props = withDefaults(defineProps<AbpDatePickerProps>(), { type: 'date' });

const emit = defineEmits<AbpDatePickerEmits>();

const config = useConfigState();
const open = ref(false);
const culture = computed(() => config.snapshot().localization.currentCulture);
const locale = computed(() => culture.value.cultureName || culture.value.name || 'en');
const direction = computed(() => (culture.value.isRightToLeft ? 'rtl' : 'ltr'));
const pattern = computed(() => {
  const format = culture.value.dateTimeFormat;
  if (props.type === 'date') return format.shortDatePattern;
  if (props.type === 'time') return format.shortTimePattern;
  return format.shortDatePattern && format.shortTimePattern
    ? `${format.shortDatePattern} ${format.shortTimePattern}`
    : undefined;
});
const granularity = computed(() =>
  props.type === 'date'
    ? 'day'
    : /s/.test(pattern.value ?? '') ||
        (!pattern.value && /\d{2}:\d{2}:\d{2}/.test(props.modelValue ?? ''))
      ? 'second'
      : 'minute',
);
const hourCycle = computed<12 | 24 | undefined>(() =>
  /h/.test(pattern.value ?? '') ? 12 : /H/.test(pattern.value ?? '') ? 24 : undefined,
);

function parse(value: string | null | undefined): DateValue | Time | undefined {
  if (!value) return undefined;
  const local = value.replace(/(?:Z|[+-]\d{2}:\d{2})$/, '').replace(/(\.\d{3})\d+$/, '$1');
  try {
    if (props.type === 'date') return parseDate(local.replace(/T.*$/, ''));
    if (props.type === 'time') return parseTime(local.replace(/^.*T/, ''));
    return parseDateTime(local);
  } catch {
    // Invalid backend values leave an editable placeholder rather than failing the form.
    return undefined;
  }
}

function date(value: string | null | undefined): DateValue | undefined {
  const parsed = parse(value);
  return parsed && 'day' in parsed ? parsed : undefined;
}
function time(value: string | null | undefined) {
  const parsed = parse(value);
  return parsed && 'hour' in parsed ? parsed : undefined;
}
const dateValue = computed(() => date(props.modelValue));
const timeValue = computed(() => time(props.modelValue));
const dateBounds = computed(() =>
  defined({ minValue: date(props.min), maxValue: date(props.max) }),
);
const timeBounds = computed(() =>
  defined({ minValue: time(props.min), maxValue: time(props.max) }),
);

function displaySegments<T extends { part: string; value: string }>(segments: T[]): T[] {
  return orderedDateSegments(
    segments,
    pattern.value,
    culture.value.dateTimeFormat.dateSeparator,
    locale.value,
    props.type === 'time' ? timeValue.value : dateValue.value,
  );
}

function change(value: DateValue | Time | undefined): void {
  if (props.disabled || props.readonly) return;
  emit('update:modelValue', value?.toString() ?? null);
}

function clear(): void {
  if (!props.disabled && !props.readonly) {
    open.value = false;
    change(undefined);
  }
}
</script>

<template>
  <div class="abp-date-picker" :class="{ 'input-group': clearable }">
    <input v-if="name" type="hidden" :name="name" :value="modelValue ?? ''" :disabled="disabled" />
    <TimeFieldRoot
      v-if="type === 'time'"
      v-slot="{ segments }"
      v-bind="
        defined({
          id,
          modelValue: timeValue,
          locale,
          hourCycle,
          granularity: granularity === 'day' ? 'minute' : granularity,
          ...timeBounds,
        })
      "
      :dir="direction"
      :disabled="!!disabled"
      :readonly="!!readonly"
      class="abp-date-picker__field form-control"
      :class="invalid ? 'is-invalid' : null"
      :aria-label="ariaLabel || placeholder"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      @update:model-value="change"
    >
      <TimeFieldInput
        v-for="(segment, index) in displaySegments(segments)"
        :key="index"
        :part="segment.part"
        class="abp-date-picker__segment"
        >{{ segment.value }}</TimeFieldInput
      >
    </TimeFieldRoot>
    <DatePickerRoot
      v-else
      v-model:open="open"
      v-bind="defined({ id, modelValue: dateValue, locale, hourCycle, granularity, ...dateBounds })"
      :dir="direction"
      :disabled="!!disabled"
      :readonly="!!readonly"
      close-on-select
      class="abp-date-picker__root"
      @update:model-value="change"
    >
      <DatePickerAnchor as-child>
        <DatePickerField
          v-slot="{ segments }"
          class="abp-date-picker__field form-control"
          :class="invalid ? 'is-invalid' : null"
          :aria-label="ariaLabel || placeholder"
          :aria-invalid="invalid ? 'true' : undefined"
          :aria-describedby="ariaDescribedby"
        >
          <DatePickerInput
            v-for="(segment, index) in displaySegments(segments)"
            :key="index"
            :part="segment.part"
            class="abp-date-picker__segment"
            >{{ segment.value }}</DatePickerInput
          >
          <DatePickerTrigger
            class="abp-date-picker__trigger"
            :disabled="disabled || readonly"
            :aria-label="ariaLabel || $t({ key: 'AbpUi::SelectDate', defaultValue: 'Select date' })"
          >
            <i class="bi bi-calendar3" aria-hidden="true" />
          </DatePickerTrigger>
        </DatePickerField>
      </DatePickerAnchor>
      <PopoverPortal>
        <DatePickerContent
          :side-offset="6"
          align="start"
          class="abp-date-picker__calendar"
          :dir="direction"
        >
          <DatePickerCalendar v-slot="{ grid, weekDays }">
            <div class="abp-date-picker__header">
              <DatePickerPrev
                class="btn btn-sm btn-outline-secondary"
                :aria-label="$t({ key: 'AbpUi::PreviousMonth', defaultValue: 'Previous month' })"
              >
                <i
                  class="bi"
                  :class="direction === 'rtl' ? 'bi-chevron-right' : 'bi-chevron-left'"
                  aria-hidden="true"
                />
              </DatePickerPrev>
              <DatePickerHeading class="fw-semibold" />
              <DatePickerNext
                class="btn btn-sm btn-outline-secondary"
                :aria-label="$t({ key: 'AbpUi::NextMonth', defaultValue: 'Next month' })"
              >
                <i
                  class="bi"
                  :class="direction === 'rtl' ? 'bi-chevron-left' : 'bi-chevron-right'"
                  aria-hidden="true"
                />
              </DatePickerNext>
            </div>
            <DatePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="abp-date-picker__grid"
            >
              <thead aria-hidden="true">
                <tr>
                  <DatePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="small text-body-secondary"
                    >{{ day }}</DatePickerHeadCell
                  >
                </tr>
              </thead>
              <tbody>
                <tr v-for="(week, index) in month.rows" :key="index">
                  <DatePickerCell v-for="day in week" :key="day.toString()" :date="day">
                    <DatePickerCellTrigger
                      :day="day"
                      :month="month.value"
                      class="abp-date-picker__day"
                    />
                  </DatePickerCell>
                </tr>
              </tbody>
            </DatePickerGrid>
          </DatePickerCalendar>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary w-100 mt-2"
            @click="open = false"
          >
            {{ $t('AbpUi::Close') }}
          </button>
        </DatePickerContent>
      </PopoverPortal>
    </DatePickerRoot>
    <button
      v-if="clearable"
      type="button"
      class="btn btn-outline-secondary"
      :disabled="disabled || readonly"
      :aria-label="$t('AbpUi::Clear')"
      @click="clear"
    >
      <i class="bi bi-x-lg" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.abp-date-picker {
  display: flex;
  min-width: 0;
}
.abp-date-picker__field {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.1rem;
  min-width: 0;
}
.abp-date-picker__root {
  flex: 1;
  min-width: 0;
}
.abp-date-picker__field:focus-within {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.15);
}
.abp-date-picker__field[data-disabled] {
  background: var(--bs-secondary-bg);
  opacity: 0.7;
}
.abp-date-picker__segment {
  border-radius: 0.2rem;
  padding-inline: 0.1rem;
  outline: none;
  font-variant-numeric: tabular-nums;
}
.abp-date-picker__segment:focus {
  background: var(--bs-primary);
  color: rgb(var(--bs-white-rgb));
}
.abp-date-picker__trigger {
  margin-inline-start: auto;
  border: 0;
  background: transparent;
  color: var(--bs-body-color);
  padding-inline-start: 0.75rem;
}
.abp-date-picker__trigger:disabled {
  opacity: 0.5;
}
.abp-date-picker__calendar {
  z-index: 1090;
  padding: 1rem;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius-lg);
  background: var(--bs-body-bg);
  color: var(--bs-body-color);
  box-shadow: var(--bs-box-shadow);
}
.abp-date-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.abp-date-picker__grid {
  border-collapse: collapse;
  text-align: center;
}
.abp-date-picker__grid th {
  font-weight: 500;
  padding-bottom: 0.5rem;
}
.abp-date-picker__day {
  border: 0;
  border-radius: var(--bs-border-radius);
  width: 2.25rem;
  height: 2.25rem;
  margin: 0.1rem;
  background: transparent;
  color: inherit;
}
.abp-date-picker__day:hover,
.abp-date-picker__day:focus-visible {
  background: var(--bs-tertiary-bg);
  outline: 2px solid var(--bs-primary);
}
.abp-date-picker__day[data-selected] {
  background: var(--bs-primary);
  color: rgb(var(--bs-white-rgb));
}
.abp-date-picker__day[data-disabled],
.abp-date-picker__day[data-outside-view] {
  opacity: 0.35;
}
.abp-date-picker__day[data-today]:not([data-selected]) {
  box-shadow: inset 0 0 0 1px var(--bs-primary);
}
</style>
