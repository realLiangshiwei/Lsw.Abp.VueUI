<template>
  <AbpModal
    :visible="true"
    :dirty="false"
    suppress-unsaved-changes-warning
    @update:visible="$event || emit('close')"
  >
    <template #header>{{ localization.t('AbpIdentity::RemoveFromTenant') }}</template>
    <AbpSpinner v-if="loading" />
    <p v-if="message" role="alert">{{ message }}</p>
    <p v-if="user">{{ user.userName }}</p>
    <AbpButton
      v-if="failed || uncertain"
      :disabled="busy || loading"
      variant="secondary"
      @click="load"
    >
      {{ localization.t('AbpUi::Refresh') }}
    </AbpButton>
    <template #footer="{ close }">
      <AbpButton variant="secondary" :disabled="busy" @click="close">{{
        localization.t('AbpUi::Cancel')
      }}</AbpButton>
      <AbpButton
        variant="danger"
        :loading="busy"
        :disabled="busy || loading || failed || uncertain || !user || !allowed"
        @click="remove"
      >
        {{ localization.t('AbpIdentity::RemoveFromTenant') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>
<script setup lang="ts">
import {
  AbpHttpError,
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityUserService, type IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpModal,
  AbpButton,
  AbpSpinner,
  useConfirmation,
  ConfirmationStatus,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { canRemoveUserFromTenant } from '../utils/user-operation-policy.js';
const props = defineProps<{ userId: string }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const users = injectAbp(IdentityUserService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const confirmation = useConfirmation();
const toaster = useToaster();
const user = shallowRef<IdentityUserDto>();
const loading = ref(false);
const busy = ref(false);
const failed = ref(false);
const uncertain = ref(false);
const message = ref('');
let revision = 0;
let controller = new AbortController();
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    props.userId,
  ]),
);
const allowed = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted('AbpIdentity.Users.Delete') &&
    Boolean(user.value && canRemoveUserFromTenant(user.value, config.snapshot())),
);
async function load(): Promise<void> {
  const own = ++revision;
  controller.abort();
  controller = new AbortController();
  user.value = undefined;
  loading.value = true;
  failed.value = false;
  message.value = '';
  try {
    const fresh = await users.get(props.userId, {
      signal: controller.signal,
      skipHandleError: true,
    });
    if (own !== revision) return;
    if (fresh.id?.toLowerCase() !== props.userId.toLowerCase())
      throw new TypeError(
        'The membership detail belongs to another user. Refresh before removing.',
      );
    user.value = fresh;
    uncertain.value = false;
  } catch (error) {
    if (own !== revision) return;
    if (uncertain.value && error instanceof AbpHttpError && error.status === 404) {
      emit('saved');
      emit('close');
      return;
    }
    failed.value = true;
    message.value = localization.t('AbpUi::ErrorLoadingDatatable');
  } finally {
    if (own === revision) loading.value = false;
  }
}
async function remove(): Promise<void> {
  if (
    !allowed.value ||
    busy.value ||
    loading.value ||
    failed.value ||
    uncertain.value ||
    !user.value
  )
    return;
  const own = revision;
  busy.value = true;
  try {
    const status = await confirmation.warn(
      'AbpIdentity::RemoveUserFromTenantConfirmationMessage',
      'AbpUi::AreYouSure',
      { messageLocalizationParams: [user.value.userName ?? ''] },
    );
    if (status !== ConfirmationStatus.confirm || own !== revision || !allowed.value) return;
    await users.removeFromTenant(props.userId, {
      signal: controller.signal,
      skipHandleError: true,
    });
    if (own !== revision) return;
    toaster.success('AbpIdentity::UserRemovedFromTenant');
    emit('saved');
    emit('close');
  } catch {
    if (own !== revision) return;
    uncertain.value = true;
    message.value = localization.t('AbpUi::ErrorLoadingDatatable');
  } finally {
    if (own === revision) busy.value = false;
  }
}
function invalidate(): void {
  revision += 1;
  controller.abort();
  user.value = undefined;
  busy.value = false;
  emit('close');
}
watch(context, invalidate, { flush: 'sync' });
watch(
  allowed,
  value => {
    if (user.value && !value) invalidate();
  },
  { flush: 'sync' },
);
onBeforeUnmount(() => {
  revision += 1;
  controller.abort();
});
void load();
</script>
