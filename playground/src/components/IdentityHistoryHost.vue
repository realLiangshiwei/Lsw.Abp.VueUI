<template>
  <form
    v-if="fixtureEnabled && config.snapshot().currentUser.isAuthenticated"
    class="card p-3 mb-3"
    data-testid="official-identity-history"
    @submit.prevent="showSelectedHistory"
  >
    <label class="form-label" :for="typeId">{{
      localization.t('AbpAuditLogging::EntityTypeFullName')
    }}</label>
    <select :id="typeId" v-model="selectedType" class="form-select mb-3" name="historyEntityType">
      <option v-for="entity in entityTypes" :key="entity" :value="entity">{{ entity }}</option>
    </select>
    <label class="form-label" :for="idId">{{ localization.t('AbpAuditLogging::EntityId') }}</label>
    <input
      :id="idId"
      v-model="selectedId"
      class="form-control mb-3"
      name="historyEntityId"
      autocomplete="off"
    />
    <AbpButton type="submit" :disabled="!selectedId.trim()">{{
      localization.t('AbpAuditLogging::ChangeHistory')
    }}</AbpButton>
  </form>
  <component :is="host" />
  <AbpModal
    v-if="failed && history.selected.value"
    :visible="true"
    :dirty="false"
    @update:visible="$event || history.close()"
  >
    <template #header>
      {{ localization.t('AbpAuditLogging::ChangeHistory') }}
      <span style="display: block">{{ history.selected.value.entityTypeFullName }}</span>
      <small style="display: block">({{ history.selected.value.entityId }})</small>
    </template>
    <div role="alert">
      <p>
        {{ localization.t('AbpUi::ErrorLoadingDatatable') }}
      </p>
      <AbpButton :loading="loading" :disabled="!retryHost" @click="retry">
        {{ localization.t('AbpUi::Refresh') }}
      </AbpButton>
    </div>
    <template #footer="{ close }">
      <AbpButton variant="secondary" @click="close">
        {{ localization.t('AbpUi::Cancel') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { EntityHistoryService, SHOW_ENTITY_HISTORY } from '@lsw-abpvue/audit-logging/config';
import { ConfigStateService, inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';
import { computed, defineAsyncComponent, ref, shallowRef, useId, watch } from 'vue';

const history = injectAbp(EntityHistoryService);
const config = injectAbp(ConfigStateService);
const localization = useLocalization();
const showHistory = injectAbp(SHOW_ENTITY_HISTORY);
const fixtureEnabled = import.meta.env.VITE_PRO_E2E_HISTORY === '1';
const entityTypes = [
  'Volo.Abp.Identity.IdentityUser',
  'Volo.Abp.Identity.IdentityRole',
  'Volo.Abp.Identity.IdentityClaimType',
  'Volo.Abp.Identity.OrganizationUnit',
];
const selectedType = ref(entityTypes[0] ?? '');
const selectedId = ref('');
const typeId = useId();
const idId = useId();
const failed = ref(false);
const loading = ref(false);
const retryHost = shallowRef<(() => void) | undefined>();
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    config.snapshot().auth.grantedPolicies,
  ]),
);
const host = defineAsyncComponent({
  loader: async () => {
    loading.value = true;
    const module = await import('@lsw-abpvue/audit-logging');
    loading.value = false;
    failed.value = false;
    retryHost.value = undefined;
    return module.EntityHistoryHost;
  },
  onError(_error, retry) {
    loading.value = false;
    failed.value = true;
    // Keep the optional host pending until the user explicitly retries.
    retryHost.value = retry;
  },
});

function retry(): void {
  const resume = retryHost.value;
  if (!resume) return;
  retryHost.value = undefined;
  resume();
}

function showSelectedHistory(): void {
  const id = selectedId.value.trim();
  if (id && entityTypes.includes(selectedType.value)) showHistory(id, selectedType.value);
}

watch(context, () => history.close(), { flush: 'sync' });
</script>
