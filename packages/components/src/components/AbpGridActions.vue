<script setup lang="ts" generic="R">
import { provideAbp } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, toRef, useTemplateRef } from 'vue';
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

/**
 * Where the menu is drawn. It has to be `fixed`: the table scrolls sideways when there
 * are more columns than fit, and a menu positioned inside that scroller is clipped by it.
 */
const toggle = useTemplateRef<HTMLElement>('toggle');
const position = ref<Record<string, string>>();

function place(): void {
  const element = toggle.value;
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const rightToLeft = getComputedStyle(element).direction === 'rtl';

  position.value = {
    position: 'fixed',
    top: `${rect.bottom}px`,
    ...(rightToLeft
      ? { right: `${window.innerWidth - rect.right}px`, left: 'auto' }
      : { left: `${rect.left}px`, right: 'auto' }),
    minWidth: `${rect.width}px`,
  };
}

/** A menu pinned to the viewport would be left behind by whatever scrolled under it. */
function closeOnScroll(): void {
  open.value = false;
}

function onToggle(isOpen: boolean): void {
  open.value = isOpen;

  if (isOpen) {
    place();
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', closeOnScroll);
    return;
  }

  window.removeEventListener('scroll', closeOnScroll, true);
  window.removeEventListener('resize', closeOnScroll);
}

onScopeDispose(() => {
  window.removeEventListener('scroll', closeOnScroll, true);
  window.removeEventListener('resize', closeOnScroll);
});

function closeMenu(): void {
  toggle.value?.focus();
  open.value = false;
}

function run(action: EntityAction<R>): void {
  closeMenu();
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
    @toggle="onToggle(($event.target as HTMLDetailsElement).open)"
    @focusout="closeOnLeave"
    @keydown.esc.prevent.stop="closeMenu"
  >
    <summary ref="toggle" class="abp-grid-actions-toggle">{{ $t(text ?? ACTIONS) }}</summary>
    <ul class="abp-grid-actions-menu" :style="position">
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
