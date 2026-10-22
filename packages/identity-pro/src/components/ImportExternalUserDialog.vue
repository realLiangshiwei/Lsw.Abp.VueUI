<template>
  <AbpModal :visible="true" :dirty="Boolean(userName)" @update:visible="$event || close()">
    <template #header>{{ localization.t('AbpIdentity::ExternalUser') }}</template>
    <AbpSpinner v-if="loading" />
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="verification" role="status">{{ verification }}</p>
    <dl v-if="verifiedUser">
      <dt>{{ localization.t('AbpIdentity::UserName') }}</dt>
      <dd>{{ verifiedUser.userName }}</dd>
      <dt>{{ localization.t('AbpIdentity::EmailAddress') }}</dt>
      <dd>{{ verifiedUser.email }}</dd>
    </dl>
    <p v-if="sharedTenant">
      {{ localization.t('AbpIdentity::InviteUser') }}
    </p>
    <p v-if="ready && !providers.length" role="status">
      {{ localization.t('AbpIdentity::NoExternalLoginProviderAvailable') }}
    </p>
    <AbpButton
      v-if="failed || uncertain || unresolved"
      variant="secondary"
      :disabled="busy"
      @click="load"
      >{{ localization.t('AbpUi::Refresh') }}</AbpButton
    >
    <form :id="formId" @submit.prevent="save">
      <AbpFormField v-slot="field" :label="localization.t('AbpIdentity::Provider')" required>
        <AbpSelect
          :id="field.id"
          v-model="providerName"
          name="externalProvider"
          :options="options"
          :disabled="busy || loading || !ready || uncertain"
        />
      </AbpFormField>
      <AbpFormField
        v-slot="field"
        :label="localization.t('AbpIdentity::UserNameOrEmailAddress')"
        required
      >
        <AbpInput
          :id="field.id"
          v-model="userName"
          name="externalUserName"
          :disabled="busy || loading || uncertain"
          autocomplete="off"
        />
      </AbpFormField>
      <AbpFormField
        v-if="selected && !selected.canObtainUserInfoWithoutPassword"
        v-slot="field"
        :label="localization.t('AbpIdentity::Password')"
        required
      >
        <AbpInput
          :id="field.id"
          v-model="password"
          name="externalPassword"
          type="password"
          :disabled="busy || loading || uncertain"
          autocomplete="new-password"
        />
      </AbpFormField>
    </form>
    <template #footer="{ close: requestClose }">
      <AbpButton variant="secondary" :disabled="busy" @click="requestClose">{{
        localization.t('AbpUi::Cancel')
      }}</AbpButton>
      <AbpButton
        :form="formId"
        type="submit"
        :loading="busy"
        :disabled="
          busy ||
          loading ||
          failed ||
          uncertain ||
          unresolved ||
          !ready ||
          !selected ||
          localMatch ||
          !mayImport
        "
        >{{ localization.t('AbpUi::Save') }}</AbpButton
      >
    </template>
  </AbpModal>
</template>
<script setup lang="ts">
import {
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  usePermission,
} from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import type { ExternalLoginProviderDto, IdentityUserDto } from '@lsw-abpvue/identity-pro/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpSelect,
  AbpSpinner,
} from '@lsw-abpvue/theme-shared';
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
const emit = defineEmits<{ close: []; saved: [user: IdentityUserDto] }>();
const service = injectAbp(IdentityUserService);
const config = injectAbp(ConfigStateService);
const permission = usePermission();
const localization = useLocalization();
const formId = useId();
const providers = ref<ExternalLoginProviderDto[]>([]);
const providerName = ref('');
const userName = ref('');
const password = ref('');
const loading = ref(false);
const busy = ref(false);
const ready = ref(false);
const failed = ref(false);
const uncertain = ref(false);
const error = ref('');
const verification = ref('');
const verifiedUser = ref<IdentityUserDto | null>(null);
const localMatch = ref(false);
const unresolvedKeys = ref(new Set<string>());
const importKey = computed(() =>
  JSON.stringify([providerName.value, userName.value.trim().toUpperCase()]),
);
const unresolved = computed(() => unresolvedKeys.value.has(importKey.value));
const sharedTenant = computed(
  () =>
    Boolean(config.snapshot().currentTenant.id) &&
    config.snapshot().multiTenancy.userSharingStrategy === 1,
);
let revision = 0;
let controller = new AbortController();
let closed = false;
const options = computed(() =>
  providers.value
    .filter(item => item.name)
    .map(item => ({ value: item.name ?? '', label: item.name ?? '' })),
);
const selected = computed(() => providers.value.find(item => item.name === providerName.value));
const mayImport = computed(
  () =>
    config.snapshot().currentUser.isAuthenticated &&
    permission.isGranted('AbpIdentity.Users && AbpIdentity.Users.Import'),
);
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentTenant.id,
    config.snapshot().multiTenancy.userSharingStrategy,
    mayImport.value,
  ]),
);
function current(own: number) {
  return !closed && own === revision && mayImport.value;
}
async function load() {
  if (closed || busy.value || !mayImport.value) return;
  const own = ++revision;
  controller.abort();
  controller = new AbortController();
  loading.value = true;
  failed.value = false;
  ready.value = false;
  error.value = '';
  try {
    const mustVerify = uncertain.value || unresolved.value;
    const result = await service.getExternalLoginProviders({
      signal: controller.signal,
      skipHandleError: true,
    });
    if (!current(own)) return;
    if (mustVerify) {
      const [byName, byEmail] = await Promise.all([
        service.findByUsername(userName.value.trim(), {
          signal: controller.signal,
          skipHandleError: true,
        }),
        service.findByEmail(userName.value.trim(), {
          signal: controller.signal,
          skipHandleError: true,
        }),
      ]);
      if (!current(own)) return;
      const existing = byName?.id ? byName : byEmail?.id ? byEmail : undefined;
      verifiedUser.value = existing ?? null;
      if (sharedTenant.value && !existing) unresolvedKeys.value.add(importKey.value);
      else if (unresolved.value) unresolvedKeys.value.delete(importKey.value);
      localMatch.value = Boolean(existing && !existing.isExternal);
      verification.value = existing
        ? localization.t('AbpIdentity::UserInformations')
        : localization.t('AbpIdentity::UserNotFound');
    }
    providers.value = result;
    if (!result.some(item => item.name === providerName.value))
      providerName.value = result[0]?.name ?? '';
    ready.value = true;
    uncertain.value = false;
  } catch {
    if (current(own)) {
      failed.value = true;
      error.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
  } finally {
    if (current(own)) loading.value = false;
  }
}
async function save() {
  if (
    !mayImport.value ||
    !ready.value ||
    loading.value ||
    busy.value ||
    uncertain.value ||
    unresolved.value ||
    failed.value ||
    !selected.value ||
    localMatch.value
  )
    return;
  if (
    !userName.value.trim() ||
    (!selected.value.canObtainUserInfoWithoutPassword && !password.value)
  ) {
    error.value = localization.t('AbpValidation::ThisFieldIsRequired.');
    return;
  }
  const own = revision;
  busy.value = true;
  error.value = '';
  try {
    const user = await service.importExternalUser(
      {
        provider: providerName.value,
        userNameOrEmailAddress: userName.value.trim(),
        ...(selected.value.canObtainUserInfoWithoutPassword ? {} : { password: password.value }),
      },
      { signal: controller.signal, skipHandleError: true },
    );
    if (!current(own)) return;
    password.value = '';
    emit('saved', user);
    close();
  } catch {
    if (current(own)) {
      uncertain.value = true;
      error.value = localization.t('AbpUi::ErrorLoadingDatatable');
    }
  } finally {
    if (current(own)) busy.value = false;
  }
}
function close() {
  if (closed) return;
  closed = true;
  revision++;
  controller.abort();
  password.value = '';
  emit('close');
}
watch(providerName, () => {
  password.value = '';
  verifiedUser.value = null;
  verification.value = '';
});
watch(userName, () => {
  localMatch.value = false;
  verification.value = '';
  verifiedUser.value = null;
});
watch(
  context,
  (value, previous) => {
    if (previous !== undefined && previous !== value) close();
    else if (mayImport.value) void load();
    else close();
  },
  { immediate: true, flush: 'sync' },
);
onBeforeUnmount(() => {
  closed = true;
  revision++;
  controller.abort();
  password.value = '';
});
</script>
