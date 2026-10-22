<template>
  <AbpModal :visible="true" size="lg" @update:visible="$event || emit('close')">
    <template #header>{{ localization.t('AbpIdentity::Session:Detail') }}</template>
    <AbpSpinner v-if="loading" />
    <div v-else-if="failed" role="alert">
      <p>{{ failureText }}</p>
      <AbpButton variant="secondary" @click="load">{{
        localization.t('AbpUi::Refresh')
      }}</AbpButton>
    </div>
    <table v-else-if="session" class="table table-striped">
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <th scope="row">{{ localization.t(row.label) }}</th>
          <td>{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
    <template #footer="{ close }"
      ><AbpButton variant="secondary" @click="close">{{
        localization.t('AbpUi::Close')
      }}</AbpButton></template
    >
  </AbpModal>
</template>
<script setup lang="ts">
import {
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentitySessionService, type IdentitySessionDto } from '@lsw-abpvue/identity-pro/proxy';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { formatIdentityUserDetailsDate } from '../utils/user-details.js';
import { isCurrentIdentitySession } from '../utils/identity-session.js';
const props = defineProps<{ sessionId: string; userId: string; isCurrent?: boolean | undefined }>();
const emit = defineEmits<{ close: [] }>();
const service = injectAbp(IdentitySessionService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const session = shallowRef<IdentitySessionDto>();
const loading = ref(false);
const failed = ref(false);
let revision = 0;
let pending: AbortController | undefined;
const allowed = computed(() => permission.isGranted('AbpIdentity.Sessions'));
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    allowed.value,
  ]),
);
const failureText = computed(() => localization.t('AbpUi::ErrorLoadingDatatable'));
const date = (value?: string | null) =>
  formatIdentityUserDetailsDate(value, config.snapshot().localization.currentCulture) ??
  localization.t('AbpIdentity::Dash');
const rows = computed(() => {
  const item = session.value;
  return item
    ? [
        { label: 'AbpIdentity::Session:Device', value: item.device },
        { label: 'AbpIdentity::Session:DeviceInfo', value: item.deviceInfo },
        { label: 'AbpIdentity::Session:UserInfo', value: item.userName },
        { label: 'AbpIdentity::DisplayName:UserId', value: item.userId },
        {
          label: 'AbpIdentity::Tenant',
          value: item.tenantId,
        },
        {
          label: 'AbpAccount::TenantName',
          value: item.tenantName,
        },
        { label: 'AbpIdentity::Session:ClientId', value: item.clientId },
        { label: 'AbpIdentity::Session:IpAddresses', value: item.ipAddresses?.join(', ') },
        { label: 'AbpIdentity::Session:SignedIn', value: date(item.signedIn) },
        { label: 'AbpIdentity::Session:LastAccessed', value: date(item.lastAccessed) },
        {
          label: 'AbpIdentity::Session:Current',
          value: localization.t(
            isCurrentIdentitySession(
              item,
              config.snapshot().currentUser,
              props.isCurrent ? { ...item, isCurrent: true } : undefined,
            )
              ? 'AbpUi::Yes'
              : 'AbpUi::No',
          ),
        },
      ]
    : [];
});
function reset(): void {
  revision += 1;
  pending?.abort();
  pending = undefined;
  session.value = undefined;
  loading.value = false;
  failed.value = false;
}
async function load(): Promise<void> {
  reset();
  if (!allowed.value || !props.sessionId) return;
  const own = revision;
  pending = new AbortController();
  const signal = pending.signal;
  loading.value = true;
  try {
    const value = await service.get(props.sessionId, { signal, skipHandleError: true });
    if (own !== revision || signal.aborted) return;
    if (value.id !== props.sessionId || value.userId !== props.userId)
      throw new TypeError('The session belongs to another user.');
    session.value = value;
  } catch {
    if (own === revision && !signal.aborted) failed.value = true;
  } finally {
    if (own === revision) loading.value = false;
  }
}
watch([() => props.sessionId, () => props.userId], load, { immediate: true });
watch(
  context,
  () => {
    reset();
    emit('close');
  },
  { flush: 'sync' },
);
onBeforeUnmount(reset);
</script>
