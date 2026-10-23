<template>
  <section v-if="allowed" class="card abp-latest-tenants" :aria-label="$t('Saas::LatestTenants')">
    <div class="card-header">
      <h2 class="h5 mb-0">{{ $t('Saas::LatestTenants') }}</h2>
    </div>
    <div class="card-body" :style="{ minHeight: `${minHeight}px` }">
      <AbpSpinner v-if="busy" />
      <p v-else-if="failed" role="alert">
        {{ $t('AbpUi::ErrorLoadingDatatable') }}
        <AbpButton variant="secondary" @click="draw">{{ $t('AbpUi::Refresh') }}</AbpButton>
      </p>
      <div v-else class="table-responsive">
        <table class="table table-sm">
          <caption class="visually-hidden">
            {{
              $t('Saas::LatestTenants')
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{{ $t('Saas::Name') }}</th>
              <th scope="col">{{ $t('Saas::EditionName') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tenant, index) in data" :key="tenant.id">
              <th scope="row">{{ index + 1 }}</th>
              <td>{{ tenant.name }}</td>
              <td>{{ tenant.editionName }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!data.length">{{ $t('Saas::NoDataAvailable') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject as injectAbp } from '@lsw-abpvue/core';
import { SaasPolicyNames } from '@lsw-abpvue/saas/config';
import { TenantService, type SaasTenantDto } from '@lsw-abpvue/saas/proxy';
import { AbpButton, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, onMounted, shallowRef } from 'vue';
import { useSaasOperation } from '../utils/use-saas-operation.js';
import { useSaasWidgetRefresh } from '../utils/use-saas-widget-refresh.js';

withDefaults(defineProps<{ minHeight?: number | undefined }>(), { minHeight: 136 });
const emit = defineEmits<{ initialized: [widget: { draw: () => Promise<void> }] }>();
const service = injectAbp(TenantService);
const operation = useSaasOperation(SaasPolicyNames.Tenants);
const { allowed, busy, failed } = operation;
const data = shallowRef<SaasTenantDto[]>([]);
async function load() {
  await operation.run(
    signal =>
      service.getList(
        { getEditionNames: true, maxResultCount: 6, skipCount: 0, sorting: 'CreationTime desc' },
        { signal },
      ),
    result => {
      data.value = result.items;
    },
  );
}
const draw = useSaasWidgetRefresh(operation, load, () => {
  data.value = [];
});
onMounted(() => emit('initialized', { draw }));
defineExpose({ draw, data: computed(() => data.value) });
</script>
