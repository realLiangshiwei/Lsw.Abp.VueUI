<template>
  <section
    v-if="allowed"
    class="card abp-editions-usage"
    :aria-label="$t('Saas::EditionUsageStatistics')"
  >
    <div class="card-header">
      <h2 class="h5 mb-0">{{ $t('Saas::EditionUsageStatistics') }}</h2>
    </div>
    <div class="card-body">
      <AbpSpinner v-if="busy" />
      <p v-else-if="failed" role="alert">
        {{ $t('AbpUi::ErrorLoadingDatatable') }}
        <AbpButton variant="secondary" @click="draw">{{ $t('AbpUi::Refresh') }}</AbpButton>
      </p>
      <p v-else-if="!segments.length">{{ $t('Saas::NoDataAvailable') }}</p>
      <template v-else>
        <svg
          viewBox="0 0 42 42"
          :style="{ width: cssSize(width), height: cssSize(height) }"
          role="img"
          :aria-label="$t('Saas::EditionUsageStatistics')"
        >
          <circle
            v-for="segment in segments"
            :key="segment.name"
            cx="21"
            cy="21"
            r="15.915494"
            fill="none"
            stroke-width="10"
            :stroke="segment.color"
            :stroke-dasharray="`${segment.percent} ${100 - segment.percent}`"
            :stroke-dashoffset="segment.offset"
          >
            <title>{{ segment.name }}: {{ segment.count }}</title>
          </circle>
        </svg>
        <ul class="list-unstyled mb-0">
          <li v-for="segment in segments" :key="segment.name">
            <span
              class="d-inline-block rounded-circle"
              :style="{ backgroundColor: segment.color, width: '0.75rem', height: '0.75rem' }"
              aria-hidden="true"
            ></span>
            {{ segment.name }}: {{ segment.count }} ({{ segment.percent.toFixed(1) }}%)
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject as injectAbp } from '@lsw-abpvue/core';
import { SaasPolicyNames } from '@lsw-abpvue/saas/config';
import { EditionService } from '@lsw-abpvue/saas/proxy';
import { AbpButton, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, onMounted, shallowRef, watch } from 'vue';
import { useSaasOperation } from '../utils/use-saas-operation.js';

withDefaults(
  defineProps<{ width?: number | string | undefined; height?: number | string | undefined }>(),
  { width: 273, height: 136 },
);
const emit = defineEmits<{ initialized: [widget: { draw: () => Promise<void> }] }>();
const service = injectAbp(EditionService);
const operation = useSaasOperation(SaasPolicyNames.Editions);
const { allowed, busy, failed } = operation;
const data = shallowRef<Record<string, number>>({});
const colors = ['#0d6efd', '#198754', '#ffc107', '#6f42c1', '#dc3545', '#0dcaf0'];
const segments = computed(() => {
  const entries = Object.entries(data.value).filter(
    ([, count]) => Number.isFinite(count) && count > 0,
  );
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  let offset = 25;
  return entries.map(([name, count], index) => {
    const percent = (count / total) * 100;
    const segment = { name, count, percent, offset, color: colors[index % colors.length] };
    offset -= percent;
    return segment;
  });
});
const cssSize = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);
async function draw() {
  await operation.run(
    signal => service.getUsageStatistics({ signal }),
    result => {
      data.value = result.data ?? {};
    },
  );
}
watch(
  [operation.context, allowed],
  () => {
    data.value = {};
    void draw();
  },
  { immediate: true },
);
onMounted(() => emit('initialized', { draw }));
defineExpose({ draw, data: computed(() => data.value) });
</script>
