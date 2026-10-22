<template>
  <ul class="abp-identity-ou-list">
    <li v-for="unit in children" :key="unit.id">
      <AbpToggle
        :model-value="selected.includes(unit.id)"
        :label="unit.displayName ?? unit.id"
        :disabled="disabled || !selectable.includes(unit.id)"
        @update:model-value="emit('toggle', unit.id, $event === true)"
      />
      <OrganizationUnitChecklist
        v-if="items.some(child => child.parentId === unit.id && !ancestors.includes(child.id))"
        :items="items"
        :parent-id="unit.id"
        :ancestors="[...ancestors, unit.id]"
        :selected="selected"
        :selectable="selectable"
        :disabled="disabled"
        @toggle="(id, checked) => emit('toggle', id, checked)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { AbpToggle } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';

interface OrganizationUnitChoice {
  id: string;
  parentId?: string | null | undefined;
  displayName?: string | undefined;
}

const props = withDefaults(
  defineProps<{
    items: readonly OrganizationUnitChoice[];
    selected: readonly string[];
    selectable: readonly string[];
    parentId?: string | undefined;
    ancestors?: readonly string[] | undefined;
    disabled?: boolean | undefined;
  }>(),
  { parentId: undefined, ancestors: () => [], disabled: false },
);
const emit = defineEmits<{ toggle: [id: string, checked: boolean] }>();
const children = computed(() =>
  props.items.filter(unit => {
    if (props.ancestors.includes(unit.id)) return false;
    if (props.parentId) return unit.parentId === props.parentId;
    return !unit.parentId || !props.items.some(parent => parent.id === unit.parentId);
  }),
);
</script>
