<script setup lang="ts">
import type {
  AbpTypeaheadEmits,
  AbpTypeaheadItem,
  AbpTypeaheadProps,
  AbpTypeaheadSlots,
} from '@lsw-abpvue/theme-shared';
import { onBeforeUnmount, ref, useId, watch } from 'vue';

const props = withDefaults(defineProps<AbpTypeaheadProps>(), {
  debounce: 300,
  minLength: 1,
  displayValue: '',
});

const emit = defineEmits<AbpTypeaheadEmits>();
defineSlots<AbpTypeaheadSlots>();

const listId = useId();
const term = ref(props.displayValue);
const items = ref<readonly AbpTypeaheadItem[]>([]);
const open = ref(false);
const active = ref(-1);
const loading = ref(false);

let timer: ReturnType<typeof setTimeout> | undefined;
let running: AbortController | undefined;

// A caller that loads the record after mounting sets the text it already has.
watch(
  () => props.displayValue,
  next => {
    if (!open.value) term.value = next;
  },
);

function cancel(): void {
  clearTimeout(timer);
  running?.abort();
  running = undefined;
  loading.value = false;
}

onBeforeUnmount(cancel);

function close(): void {
  open.value = false;
  active.value = -1;
}

function onInput(event: Event): void {
  term.value = (event.target as HTMLInputElement).value;
  emit('update:displayValue', term.value);
  cancel();

  if (term.value.length < props.minLength) {
    items.value = [];
    close();
    return;
  }

  loading.value = true;
  timer = setTimeout(() => {
    const controller = new AbortController();
    running = controller;

    void props
      .search(term.value, controller.signal)
      .then(found => {
        if (controller.signal.aborted) return;
        items.value = found;
        open.value = true;
        active.value = found.length > 0 ? 0 : -1;
      })
      .finally(() => {
        if (!controller.signal.aborted) loading.value = false;
      });
  }, props.debounce);
}

function choose(item: AbpTypeaheadItem): void {
  term.value = item.label;
  close();
  emit('update:modelValue', item.value);
  emit('update:displayValue', item.label);
  emit('select', item);
}

function clear(): void {
  term.value = '';
  items.value = [];
  close();
  emit('update:modelValue', null);
  emit('update:displayValue', '');
  emit('select', null);
}

function onKeydown(event: KeyboardEvent): void {
  if (!open.value || items.value.length === 0) return;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    active.value = (active.value + step + items.value.length) % items.value.length;
    return;
  }

  if (event.key === 'Enter') {
    const item = items.value[active.value];
    if (item) {
      event.preventDefault();
      choose(item);
    }
    return;
  }

  if (event.key === 'Escape') close();
}
</script>

<template>
  <div class="abp-typeahead" :class="clearable ? 'input-group' : null">
    <input
      :id="id"
      :name="name"
      type="text"
      role="combobox"
      autocomplete="off"
      :value="term"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="listId"
      aria-autocomplete="list"
      :aria-busy="loading ? 'true' : undefined"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      class="form-control"
      :class="invalid ? 'is-invalid' : null"
      @input="onInput"
      @keydown="onKeydown"
      @blur="close"
    />

    <button
      v-if="clearable"
      type="button"
      class="btn btn-outline-secondary"
      :disabled="disabled"
      :aria-label="$t('AbpUi::Clear')"
      @mousedown="$event.preventDefault()"
      @click="clear"
    >
      <i class="bi bi-x-lg" aria-hidden="true" />
    </button>

    <ul v-show="open" :id="listId" class="abp-typeahead__list list-group" role="listbox">
      <li
        v-for="(item, index) in items"
        :key="String(item.value)"
        class="list-group-item list-group-item-action"
        :class="index === active ? 'active' : null"
        role="option"
        :aria-selected="modelValue === item.value ? 'true' : 'false'"
        @mousedown="$event.preventDefault()"
        @click="choose(item)"
      >
        <slot name="item" :item="item" :active="index === active">{{ item.label }}</slot>
      </li>

      <li v-if="items.length === 0" class="list-group-item text-body-secondary">
        <slot name="empty">{{ $t('AbpUi::NoDataAvailableInDatatable') }}</slot>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.abp-typeahead {
  position: relative;
}

.abp-typeahead__list {
  position: absolute;
  top: 100%;
  z-index: 5;
  width: 100%;
  max-height: 16rem;
  overflow-y: auto;
}
</style>
