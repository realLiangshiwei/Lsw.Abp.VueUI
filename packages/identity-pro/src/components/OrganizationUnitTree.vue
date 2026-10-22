<template>
  <ul class="abp-organization-tree" style="padding-inline-start: 1.25rem; margin: 0">
    <li v-for="unit in children" :key="unit.id">
      <div
        class="abp-organization-tree__row"
        style="
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          padding-block: 0.5rem;
        "
      >
        <button
          type="button"
          class="abp-organization-tree__select"
          :style="{
            border: '1px solid currentColor',
            background: 'transparent',
            color: 'inherit',
            borderRadius: '.25rem',
            padding: '.35rem .5rem',
            overflowWrap: 'anywhere',
            textAlign: 'start',
            fontWeight: unit.id === selectedId ? 'bold' : undefined,
            outline: unit.id === selectedId ? '2px solid currentColor' : undefined,
          }"
          :aria-pressed="unit.id === selectedId"
          :disabled="busy"
          @click="emit('select', unit)"
        >
          {{ unit.displayName }}
        </button>
        <div
          v-if="manageable"
          class="abp-organization-tree__actions"
          style="display: flex; flex-wrap: wrap; gap: 0.25rem"
        >
          <AbpButton
            variant="secondary"
            outline
            size="sm"
            :disabled="busy"
            :aria-label="`${localization.t('AbpUi::Edit')} ${unit.displayName}`"
            @click="emit('edit', unit)"
            >{{ localization.t('AbpUi::Edit') }}</AbpButton
          >
          <AbpButton
            variant="secondary"
            outline
            size="sm"
            :disabled="busy"
            :aria-label="`${localization.t('AbpIdentity::AddSubUnit')} ${unit.displayName}`"
            @click="emit('add', unit)"
            >{{ localization.t('AbpIdentity::AddSubUnit') }}</AbpButton
          >
          <AbpButton
            variant="secondary"
            outline
            size="sm"
            :disabled="busy"
            :aria-label="moveLabel(unit.displayName)"
            @click="emit('move', unit)"
            >{{ moveLabel(unit.displayName) }}</AbpButton
          >
          <AbpButton
            variant="secondary"
            outline
            size="sm"
            :disabled="busy"
            :aria-label="`${localization.t('AbpIdentity::MoveAllUsers')} ${unit.displayName}`"
            @click="emit('moveUsers', unit)"
            >{{ localization.t('AbpIdentity::MoveAllUsers') }}</AbpButton
          >
          <AbpButton
            variant="danger"
            outline
            size="sm"
            :disabled="busy"
            :aria-label="`${localization.t('AbpUi::Delete')} ${unit.displayName}`"
            @click="emit('remove', unit)"
            >{{ localization.t('AbpUi::Delete') }}</AbpButton
          >
        </div>
      </div>
      <OrganizationUnitTree
        v-if="
          items.some(child => child.parentId === unit.id && !ancestors.includes(child.id ?? ''))
        "
        :items="items"
        :parent-id="unit.id"
        :ancestors="[...ancestors, unit.id ?? '']"
        :selected-id="selectedId"
        :manageable="manageable"
        :busy="busy"
        @select="emit('select', $event)"
        @edit="emit('edit', $event)"
        @add="emit('add', $event)"
        @move="emit('move', $event)"
        @move-users="emit('moveUsers', $event)"
        @remove="emit('remove', $event)"
      />
    </li>
  </ul>
</template>
<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import type { OrganizationUnitWithDetailsDto } from '@lsw-abpvue/identity-pro/proxy';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';
import { organizationUnitRootIds } from '../utils/organization-units.js';
const props = withDefaults(
  defineProps<{
    items: readonly OrganizationUnitWithDetailsDto[];
    selectedId?: string | undefined;
    parentId?: string | undefined;
    ancestors?: readonly string[] | undefined;
    manageable: boolean;
    busy: boolean;
  }>(),
  { parentId: undefined, selectedId: undefined, ancestors: () => [] },
);
const emit = defineEmits<{
  select: [unit: OrganizationUnitWithDetailsDto];
  edit: [unit: OrganizationUnitWithDetailsDto];
  add: [unit: OrganizationUnitWithDetailsDto];
  move: [unit: OrganizationUnitWithDetailsDto];
  moveUsers: [unit: OrganizationUnitWithDetailsDto];
  remove: [unit: OrganizationUnitWithDetailsDto];
}>();
const localization = useLocalization();
const moveLabel = (name: string | undefined) =>
  localization.t('AbpIdentity::MoveOrganizationUnit', name ?? '');
const rootIds = computed(() => organizationUnitRootIds(props.items));
const children = computed(() =>
  props.items.filter(
    unit =>
      unit.id &&
      !props.ancestors.includes(unit.id) &&
      (props.parentId ? unit.parentId === props.parentId : rootIds.value.has(unit.id)),
  ),
);
</script>
