<template>
  <section v-if="allowed" class="abp-audit-statistics" :aria-label="localization.t(title)">
    <h3>{{ localization.t(title) }}</h3>
    <AbpSpinner v-if="loading" />
    <p v-else-if="failed" role="alert">
      {{ localization.t('AbpUi::ErrorLoadingDatatable')
      }}<AbpButton variant="secondary" @click="filter && draw(filter)">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <template v-else-if="data">
      <svg
        v-if="entries.length"
        style="max-width: 100%; color: #dc3545"
        :width="width ?? 400"
        :height="height ?? 240"
        viewBox="0 0 400 240"
        role="img"
        :aria-label="localization.t(title)"
      >
        <title>{{ localization.t(title) }}</title>
        <template v-if="metric === 'duration'">
          <g v-for="([label, value], index) in entries" :key="label">
            <rect
              :x="(index * 380) / entries.length + 10"
              :y="210 - (value / maximum) * 180"
              :width="Math.max(1, 360 / entries.length)"
              :height="(value / maximum) * 180"
              fill="currentColor"
            >
              <title>{{ label }}: {{ value }}</title>
            </rect>
          </g>
        </template>
        <template v-else>
          <circle
            v-for="([label, value], index) in entries"
            :key="label"
            cx="200"
            cy="115"
            r="80"
            fill="none"
            :stroke="index ? '#198754' : '#dc3545'"
            stroke-width="35"
            pathLength="100"
            :stroke-dasharray="`${(value / total) * 100} 100`"
            :stroke-dashoffset="
              (-entries.slice(0, index).reduce((sum, entry) => sum + entry[1], 0) / total) * 100
            "
            transform="rotate(-90 200 115)"
          >
            <title>{{ label }}: {{ value }}</title>
          </circle>
        </template>
      </svg>
      <table class="table">
        <caption class="visually-hidden">
          {{
            localization.t(title)
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              {{
                localization.t(
                  metric === 'duration' ? 'AbpAuditLogging::Date' : 'AbpAuditLogging::HasException',
                )
              }}
            </th>
            <th scope="col">
              {{
                localization.t(
                  metric === 'duration'
                    ? 'AbpAuditLogging::AverageExecutionDurationInMilliseconds'
                    : 'AbpAuditLogging::TotalRecords',
                )
              }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[label, value] in entries" :key="label">
            <th scope="row">
              {{ metric === 'error' ? localization.t(`AbpAuditLogging::${label}`) : label }}
            </th>
            <td>{{ value }}</td>
          </tr>
          <tr v-if="!entries.length">
            <td colspan="2">{{ localization.t('AbpUi::NoDataAvailableInDatatable') }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </section>
</template>
<script setup lang="ts">
import {
  AuditLogsService,
  type GetErrorRateFilter,
  type GetErrorRateOutput,
} from '@lsw-abpvue/audit-logging/proxy';
import { inject } from '@lsw-abpvue/core';
import { AbpButton, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, onMounted, shallowRef, watch } from 'vue';
import { useAuditLogging } from '../utils/use-audit-logging.js';
import { useAuditRequest } from '../utils/use-audit-request.js';
const props = defineProps<{
  metric: 'duration' | 'error';
  width?: number | undefined;
  height?: number | undefined;
}>();
const emit = defineEmits<{ initialized: [widget: { draw: typeof draw }] }>();
const service = inject(AuditLogsService);
const { allowed, context, localization } = useAuditLogging();
const { data, failed, loading, run } = useAuditRequest<GetErrorRateOutput>(context);
const filter = shallowRef<GetErrorRateFilter>();
const title = computed(
  () =>
    `AbpAuditLogging::${props.metric === 'duration' ? 'AverageExecutionDurationInLogsPerDay' : 'ErrorRateInLogs'}`,
);
const entries = computed(() =>
  Object.entries(data.value?.data ?? {}).filter(
    ([, value]) => Number.isFinite(value) && value >= 0,
  ),
);
const maximum = computed(() => Math.max(1, ...entries.value.map(([, value]) => value)));
const total = computed(() => entries.value.reduce((sum, [, value]) => sum + value, 0) || 1);
async function draw(value: GetErrorRateFilter): Promise<void> {
  if (!allowed.value) return;
  filter.value = { ...value };
  await run(signal =>
    props.metric === 'duration'
      ? service.getAverageExecutionDurationPerDay({ ...value }, { signal, skipHandleError: true })
      : service.getErrorRate({ ...value }, { signal, skipHandleError: true }),
  );
}
defineExpose({ draw });
onMounted(() => emit('initialized', { draw }));
watch(
  context,
  () => {
    filter.value = undefined;
  },
  { flush: 'sync' },
);
</script>
