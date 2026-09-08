<script setup lang="ts">
defineProps<{
  /** Localization key of the heading. */
  title?: string | undefined;
}>();

defineSlots<{
  default?: () => unknown;
  title?: () => unknown;
  toolbar?: () => unknown;
}>();
</script>

<template>
  <section class="abp-page">
    <!-- The breadcrumb belongs to the layout: it is the same on every page of a theme. -->
    <header v-if="title || $slots.title || $slots.toolbar" class="abp-page-header">
      <h1 class="abp-page-title">
        <slot name="title">{{ title ? $t(title) : '' }}</slot>
      </h1>
      <div v-if="$slots.toolbar" class="abp-page-actions">
        <slot name="toolbar" />
      </div>
    </header>

    <slot />
  </section>
</template>
