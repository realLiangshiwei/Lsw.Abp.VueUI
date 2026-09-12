<script setup lang="ts" generic="R">
import { provideAbp } from '@lsw-abpvue/core';
import {
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpSelect,
  AbpToggle,
  AbpTypeahead,
  useValidationMessages,
  type AbpFormControl as AbpFormControlModel,
  type AbpOption,
  type AbpTypeaheadItem,
} from '@lsw-abpvue/theme-shared';
import { computed, shallowRef, toRef, watch } from 'vue';
import { PropType } from '../enums/prop-type.js';
import type { FormProp } from '../models/form-props.js';
import { unwrapResolvable, type PropData } from '../models/prop-data.js';
import { EXTENSIONS_FORM_PROP, ROW_RECORD } from '../tokens/extensions.token.js';

const props = defineProps<{
  prop: FormProp<R>;
  control: AbpFormControlModel;
  record: R;
  data: PropData<R>;
}>();

defineSlots<{
  default?: (props: { prop: FormProp<R>; control: AbpFormControlModel }) => unknown;
}>();

/** A control a contributor brought reaches the field and the record through the tokens. */
provideAbp([
  { provide: EXTENSIONS_FORM_PROP, useValue: props.prop as FormProp },
  { provide: ROW_RECORD, useValue: toRef(props, 'record') },
]);

const messagesOf = useValidationMessages();

const errors = computed(() => (props.control.touched ? messagesOf(props.control.errors) : []));

/** Required is a rule, so it is asked rather than declared: does an empty value fail? */
const required = computed(() =>
  props.prop
    .validators(props.data)
    .some(validate => validate('', { valueOf: () => undefined })?.rule === 'required'),
);

/**
 * The ref `unwrapResolvable` made for the current callback result. Two levels on
 * purpose: this one is rebuilt when the field or the record changes, and reading the
 * value it resolves to happens in the watcher below. Reading it here instead would let a
 * promise settling invalidate this computed, which would ask the callback again, which
 * would settle again -- a loop that issues a request per turn until the heap gives up.
 */
const resolvedOptions = computed(() => unwrapResolvable(props.prop.options?.(props.data) ?? []));

const options = shallowRef<readonly AbpOption[]>([]);

watch(
  () => resolvedOptions.value.value,
  next => (options.value = next ?? []),
  {
    immediate: true,
  },
);

const inputType = computed(() => {
  switch (props.prop.type) {
    case PropType.Number:
      return 'number';
    case PropType.Email:
      return 'email';
    case PropType.Password:
    case PropType.PasswordInputGroup:
      return 'password';
    case PropType.Text:
      return 'textarea';
    default:
      return 'text';
  }
});

const dateType = computed(() =>
  props.prop.type === PropType.Time
    ? 'time'
    : props.prop.type === PropType.Date
      ? 'date'
      : 'datetime',
);

const isInput = computed(() =>
  (
    [
      PropType.String,
      PropType.Text,
      PropType.Number,
      PropType.Email,
      PropType.Password,
      PropType.PasswordInputGroup,
    ] as PropType[]
  ).includes(props.prop.type),
);

const isDate = computed(() =>
  ([PropType.Date, PropType.Time, PropType.DateTime] as PropType[]).includes(props.prop.type),
);

const isSelect = computed(() =>
  ([PropType.Enum, PropType.MultiSelect] as PropType[]).includes(props.prop.type),
);

/** The typeahead asks the prop's own `options` callback, with what the user typed. */
async function search(term: string): Promise<AbpTypeaheadItem[]> {
  const resolved = await props.prop.options?.(props.data, term);
  const items = unwrapResolvable(resolved ?? []).value ?? [];

  return items.map(option => ({ value: option.value, label: option.label }));
}
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -- `control.value` is writable on purpose: that is what `v-model` on a form control means here (api-parity-map §11). -->
  <!-- A hidden field is part of the form and none of the page. -->
  <template v-if="prop.type !== PropType.Hidden">
    <slot :prop="prop" :control="control">
      <AbpFormField
        :label="prop.displayName ? $t(prop.displayName) : undefined"
        :for="prop.id"
        :required="required"
        :hint="prop.formText ? $t(prop.formText) : undefined"
        :errors="errors"
        :disabled="control.disabled"
      >
        <template #default="{ id, describedBy, invalid }">
          <component
            :is="prop.component"
            v-if="prop.component"
            v-model="control.value"
            :prop="prop"
            :record="record"
            :disabled="control.disabled"
            :readonly="control.readonly"
          />

          <AbpInput
            v-else-if="isInput"
            :id="id"
            v-model="control.value as string | number | null"
            :name="prop.name"
            :type="inputType"
            :revealable="prop.type === PropType.PasswordInputGroup"
            :autocomplete="prop.autocomplete"
            :disabled="control.disabled"
            :readonly="control.readonly"
            :invalid="invalid"
            :aria-describedby="describedBy"
            @blur="control.markAsTouched()"
          />

          <AbpToggle
            v-else-if="prop.type === PropType.Boolean"
            :id="id"
            v-model="control.value as boolean"
            variant="switch"
            :name="prop.name"
            :disabled="control.disabled"
            :readonly="control.readonly"
            :invalid="invalid"
            :aria-describedby="describedBy"
          />

          <AbpDatePicker
            v-else-if="isDate"
            :id="id"
            v-model="control.value as string | null"
            :type="dateType"
            :name="prop.name"
            :disabled="control.disabled"
            :readonly="control.readonly"
            :invalid="invalid"
            :aria-describedby="describedBy"
          />

          <AbpSelect
            v-else-if="isSelect"
            :id="id"
            v-model="control.value as string | number | boolean | null"
            :options="options"
            :multiple="prop.type === PropType.MultiSelect"
            :name="prop.name"
            :disabled="control.disabled"
            :readonly="control.readonly"
            :invalid="invalid"
            :aria-describedby="describedBy"
          />

          <AbpTypeahead
            v-else-if="prop.type === PropType.Typeahead"
            :id="id"
            v-model="control.value as string | number | boolean | null"
            :search="search"
            :name="prop.name"
            :disabled="control.disabled"
            :readonly="control.readonly"
            :invalid="invalid"
            :aria-describedby="describedBy"
          />
        </template>
      </AbpFormField>
    </slot>
  </template>
</template>
