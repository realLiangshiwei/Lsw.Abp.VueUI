<script setup lang="ts" generic="R">
import { provideAbp } from '@lsw-abpvue/core';
import { toRef } from 'vue';
import type { EntityProp, PropValue } from '../models/entity-props.js';
import { ROW_INDEX, ROW_RECORD } from '../tokens/extensions.token.js';

const props = defineProps<{
  prop: EntityProp<R>;
  record: R;
  index: number;
  value: PropValue;
}>();

/**
 * A cell a contributor supplies its own component for. The row is handed over as props
 * and, for a component that is not in the template's reach, through the tokens as well
 * (design 05 §7).
 */
provideAbp([
  { provide: ROW_RECORD, useValue: toRef(props, 'record') },
  { provide: ROW_INDEX, useValue: toRef(props, 'index') },
]);
</script>

<template>
  <component
    :is="prop.component"
    v-if="prop.component"
    :record="record"
    :index="index"
    :prop="prop"
    :value="value"
  />
</template>
