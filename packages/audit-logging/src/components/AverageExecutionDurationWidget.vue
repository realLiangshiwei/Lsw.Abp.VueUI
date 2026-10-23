<template>
  <AuditStatistics
    ref="widget"
    metric="duration"
    :width="width"
    :height="height"
    @initialized="emit('initialized', $event)"
  />
</template>
<script setup lang="ts">
import type { GetAverageExecutionDurationPerDayInput } from '@lsw-abpvue/audit-logging/proxy';
import { useTemplateRef } from 'vue';
import AuditStatistics from './AuditStatistics.vue';
defineProps<{ width?: number | undefined; height?: number | undefined }>();
const emit = defineEmits<{
  initialized: [
    widget: { draw: (filter: GetAverageExecutionDurationPerDayInput) => Promise<void> },
  ];
}>();
const widget = useTemplateRef('widget');
defineExpose({
  draw: (filter: GetAverageExecutionDurationPerDayInput) => widget.value?.draw(filter),
});
</script>
