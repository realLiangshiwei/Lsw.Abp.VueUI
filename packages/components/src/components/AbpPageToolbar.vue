<script setup lang="ts" generic="R">
import { provideAbp } from '@lsw-abpvue/core';
import { AbpButton } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';
import type { ToolbarAction } from '../models/actions.js';
import type { PropData } from '../models/prop-data.js';
import { EXTENSIONS_ACTION_DATA } from '../tokens/extensions.token.js';
import { useGetInjected, useToolbarActions } from '../utils/use-action-list.js';

const props = withDefaults(
  defineProps<{
    /** The page of records the buttons act on. */
    data?: readonly R[] | undefined;
  }>(),
  { data: () => [] },
);

const { getInjected } = useGetInjected();

const actionData = computed<PropData<readonly R[]>>(() => ({
  record: props.data,
  getInjected,
}));

provideAbp([{ provide: EXTENSIONS_ACTION_DATA, useValue: actionData }]);

const actions = useToolbarActions<readonly R[]>(() => actionData.value);

function run(action: ToolbarAction<readonly R[]>): void {
  void action.action(actionData.value);
}
</script>

<template>
  <div class="abp-page-toolbar">
    <AbpButton
      v-for="action in actions"
      :key="action.text"
      size="sm"
      variant="primary"
      :class="action.btnClass"
      :style="action.btnStyle"
      :icon-class="action.icon"
      @click="run(action)"
    >
      {{ $t(action.text) }}
    </AbpButton>
  </div>
</template>
