<script setup lang="ts" generic="R">
import { provideAbp } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { computed, ref, toRef } from 'vue';
import { ACTIONS } from '../defaults/texts.js';
import type { EntityAction } from '../models/actions.js';
import type { PropData } from '../models/prop-data.js';
import { EXTENSIONS_ACTION_DATA, ROW_INDEX, ROW_RECORD } from '../tokens/extensions.token.js';
import { useEntityActions, useGetInjected } from '../utils/use-action-list.js';

const props = defineProps<{
  record: R;
  index: number;
  /** Localization key of the label the menu opens under. */
  text?: string | undefined;
}>();

const { getInjected } = useGetInjected();

const data = computed<PropData<R>>(() => ({
  record: props.record,
  index: props.index,
  getInjected,
}));

// The row is reachable from a component an action renders, the way the cells are.
provideAbp([
  { provide: ROW_RECORD, useValue: toRef(props, 'record') },
  { provide: ROW_INDEX, useValue: toRef(props, 'index') },
  { provide: EXTENSIONS_ACTION_DATA, useValue: data },
]);

const actions = useEntityActions<R>(() => data.value);
const open = ref(false);

function run(action: EntityAction<R>): void {
  open.value = false;
  void action.action(data.value);
}

/** Tabbing from the summary into the menu is not leaving it. */
function closeOnLeave(event: FocusEvent): void {
  const next = event.relatedTarget;
  if (next instanceof Node && (event.currentTarget as HTMLElement).contains(next)) return;

  open.value = false;
}
</script>

<template>
  <!-- One button stands on its own; several collapse into a disclosure, which is what
       keeps a row of five actions from being wider than the data. -->
  <AbpButton
    v-if="actions.length === 1 && actions[0]"
    size="sm"
    variant="primary"
    :class="actions[0].btnClass"
    :style="actions[0].btnStyle"
    :icon-class="actions[0].icon"
    :aria-label="actions[0].showOnlyIcon ? $t(actions[0].text) : undefined"
    @click="run(actions[0])"
  >
    <template v-if="!actions[0].showOnlyIcon">{{ $t(actions[0].text) }}</template>
  </AbpButton>

  <details
    v-else-if="actions.length > 1"
    class="abp-grid-actions"
    :open="open"
    @toggle="open = ($event.target as HTMLDetailsElement).open"
    @focusout="closeOnLeave"
    @keydown.esc="open = false"
  >
    <summary class="abp-grid-actions-toggle">{{ $t(text ?? ACTIONS) }}</summary>
    <ul class="abp-grid-actions-menu">
      <li v-for="action in actions" :key="action.text">
        <button
          type="button"
          class="abp-grid-actions-item"
          :class="action.btnClass"
          :style="action.btnStyle"
          @click="run(action)"
        >
          <i v-if="action.icon" :class="action.icon" aria-hidden="true" />
          <span>{{ $t(action.text) }}</span>
        </button>
      </li>
    </ul>
  </details>
</template>
