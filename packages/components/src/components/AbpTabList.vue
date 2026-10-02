<script setup lang="ts" generic="T extends AbpTabItem">
import { useLocalization } from '@lsw-abpvue/core';
import type { AbpTabItem } from '../models/tab.js';

const props = withDefaults(
  defineProps<{
    items: readonly T[];
    /** Vertical is the ABP default: a column of tabs beside the panel. */
    orientation?: 'vertical' | 'horizontal' | undefined;
    /** Already localized; names the list for a screen reader. */
    ariaLabel?: string | undefined;
  }>(),
  { orientation: 'vertical', ariaLabel: undefined },
);

/** The selected tab's name. */
const selected = defineModel<string>({ default: '' });

defineSlots<{
  /** The tab's label; the default is the localized `text`, or the localized name. */
  label?: (context: { item: T }) => unknown;
}>();

const localization = useLocalization();

const labelOf = (item: T): string => localization.t(item.text ?? item.name);

function onKeydown(event: KeyboardEvent, index: number): void {
  const button = event.currentTarget as HTMLButtonElement;
  const vertical = props.orientation === 'vertical';
  const rtl = button.closest('[dir]')?.getAttribute('dir') === 'rtl';
  const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
  const backward = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
  let next: number;

  if (event.key === forward) next = (index + 1) % props.items.length;
  else if (event.key === backward) next = (index + props.items.length - 1) % props.items.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = props.items.length - 1;
  else return;

  const item = props.items[next];
  if (!item) return;
  event.preventDefault();
  selected.value = item.name;
  button.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
}
</script>

<template>
  <div
    class="abp-tabs"
    :class="`abp-tabs--${orientation}`"
    role="tablist"
    :aria-orientation="orientation"
    :aria-label="ariaLabel"
  >
    <button
      v-for="(item, index) in items"
      :key="item.name"
      type="button"
      role="tab"
      class="abp-tabs__tab"
      :class="{ 'abp-tabs__tab--active': item.name === selected }"
      :aria-selected="item.name === selected"
      :tabindex="item.name === selected ? 0 : -1"
      @click="selected = item.name"
      @keydown="onKeydown($event, index)"
    >
      <i v-if="item.iconClass" :class="item.iconClass" aria-hidden="true" />
      <slot name="label" :item="item">{{ labelOf(item) }}</slot>
    </button>
  </div>
</template>
