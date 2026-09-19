<script setup lang="ts" generic="T extends AbpTabItem">
import { useLocalization } from '@lsw-abpvue/core';
import type { AbpTabItem } from '../models/tab.js';

withDefaults(
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
      v-for="item in items"
      :key="item.name"
      type="button"
      role="tab"
      class="abp-tabs__tab"
      :class="{ 'abp-tabs__tab--active': item.name === selected }"
      :aria-selected="item.name === selected"
      :tabindex="item.name === selected ? 0 : -1"
      @click="selected = item.name"
    >
      <i v-if="item.iconClass" :class="item.iconClass" aria-hidden="true" />
      <slot name="label" :item="item">{{ labelOf(item) }}</slot>
    </button>
  </div>
</template>
