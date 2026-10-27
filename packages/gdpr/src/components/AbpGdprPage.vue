<template>
  <AbpPage v-if="allowed" title="AbpGdpr::PersonalData">
    <template #toolbar>
      <AbpPageToolbar :key="context" :data="items">
        <template #action="{ action, data }">
          <AbpButton
            v-if="action === deleteAction"
            size="sm"
            variant="danger"
            :disabled="busy !== null"
            @click="action.action(data)"
          >
            {{ $t(action.text) }}
          </AbpButton>
        </template>
      </AbpPageToolbar>
    </template>
    <p>{{ $t('AbpGdpr::PersonalDataDescription') }}</p>
    <AbpExtensibleTable :key="context" :data="items" :list="list" caption="AbpGdpr::PersonalData" />
    <p v-if="error || operationError" role="alert">
      {{ $t(operationError ?? 'AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" :disabled="busy !== null" @click="refresh">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
  </AbpPage>
</template>

<script setup lang="ts">
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  EXTENSIONS_IDENTIFIER,
} from '@lsw-abpvue/components';
import {
  ConfigStateService,
  inject,
  provideAbp,
  SessionStateService,
  useLatest,
  useListService,
  WindowService,
} from '@lsw-abpvue/core';
import { GdprRequestService, type GdprRequestDto } from '@lsw-abpvue/gdpr/proxy';
import { AbpButton, ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { computed, onScopeDispose, ref, watch } from 'vue';
import { DEFAULT_PERSONAL_DATA_TOOLBAR_ACTIONS } from '../defaults/extensions.js';
import { GdprComponents } from '../enums/components.js';
import { gdprExtensionsResolver } from '../resolvers/extensions.resolver.js';
import { GDPR_PAGE } from '../tokens/page.token.js';

const config = inject(ConfigStateService);
const session = inject(SessionStateService);
const service = inject(GdprRequestService);
const confirmation = inject(ConfirmationService);
const platform = inject(WindowService);
const context = computed(() =>
  JSON.stringify([
    config.snapshot().currentUser.id,
    config.snapshot().currentUser.isAuthenticated,
    config.snapshot().currentTenant.id,
    session.getTenant()?.id,
    config.snapshot().auth.grantedPolicies,
    config.snapshot().features.values,
    config.snapshot().globalFeatures.enabledFeatures,
    config.snapshot().objectExtensions.modules.Gdpr,
    config.snapshot().objectExtensions.enums,
  ]),
);
const allowed = computed(
  () =>
    !!config.snapshot().currentUser.id &&
    config.snapshot().currentUser.isAuthenticated &&
    (session.getTenant()?.id ?? null) === (config.snapshot().currentTenant.id ?? null),
);
const busy = ref<string | null>(null);
const requestAllowed = ref(false);
const operationError = ref<string | null>(null);
const eligibility = useLatest<boolean>();
const deleteAction = DEFAULT_PERSONAL_DATA_TOOLBAR_ACTIONS[1];
let lifetime = new AbortController();
let ownConfirmation: typeof confirmation.current.value = null;
const list = useListService();
const { items, error } = list.hookToQuery(async (query, signal) => {
  const userId = config.snapshot().currentUser.id;
  if (!allowed.value || !userId) return { items: [], totalCount: 0 };
  const own = AbortSignal.any([signal, lifetime.signal]);
  const result = await service.getList({ ...query, userId }, { signal: own });
  return own.aborted ? { items: [], totalCount: 0 } : result;
});
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: GdprComponents.PersonalData },
  {
    provide: GDPR_PAGE,
    useValue: {
      btnDisabled: computed(() => !allowed.value || !requestAllowed.value || busy.value !== null),
      busy: computed(() => busy.value),
      requestPersonalDate,
      deleteData,
      getUserData,
    },
  },
]);
injector.runInContext(gdprExtensionsResolver);

async function checkRequestAllowed(): Promise<void> {
  requestAllowed.value = false;
  if (!allowed.value) return;
  const signal = lifetime.signal;
  try {
    const result = await eligibility.run(own =>
      service.isNewRequestAllowed({ signal: AbortSignal.any([own, signal]) }),
    );
    if (!signal.aborted && result !== undefined) requestAllowed.value = result;
  } catch {
    if (!signal.aborted) operationError.value = 'AbpUi::Error';
  }
}

async function run(name: string, action: (signal: AbortSignal) => Promise<void>): Promise<void> {
  if (!allowed.value || busy.value !== null) return;
  const signal = lifetime.signal;
  busy.value = name;
  operationError.value = null;
  try {
    await action(signal);
  } catch {
    if (!signal.aborted) operationError.value = 'AbpUi::Error';
  } finally {
    if (!signal.aborted) busy.value = null;
  }
}

async function requestPersonalDate(): Promise<void> {
  if (!requestAllowed.value) return;
  await run('request', async signal => {
    await service.prepareUserData({ signal });
    if (signal.aborted) return;
    requestAllowed.value = false;
    list.get();
    await checkRequestAllowed();
  });
}

async function deleteData(): Promise<void> {
  await run('delete', async signal => {
    const answer = confirmation.warn('AbpGdpr::DeletePersonalDataWarning', '');
    const prompt = confirmation.current.value;
    ownConfirmation = prompt;
    const status = await answer;
    if (ownConfirmation === prompt) ownConfirmation = null;
    if (signal.aborted || status !== ConfirmationStatus.confirm) return;
    await service.deleteUserData({ signal });
    if (signal.aborted) return;
    list.get();
    const receipt = confirmation.success('AbpGdpr::PersonalDataDeleteRequestReceived', '');
    const received = confirmation.current.value;
    ownConfirmation = received;
    await receipt;
    if (ownConfirmation === received) ownConfirmation = null;
  });
}

async function getUserData(record: GdprRequestDto): Promise<void> {
  const id = record.id;
  if (!id || !(Date.parse(record.readyTime) < Date.now())) return;
  await run(id, async signal => {
    const result = await service.getDownloadToken(id, { signal });
    if (signal.aborted) return;
    if (!result.token) {
      operationError.value = 'AbpGdpr::CanNotGetDownloadToken';
      return;
    }
    const file = await service.getUserData(id, result.token, { signal });
    if (!signal.aborted) platform.downloadBlob(file, 'PersonalData');
  });
}

function refresh(): void {
  operationError.value = null;
  list.getWithoutPageReset();
  void checkRequestAllowed();
}

function cancel(): void {
  lifetime.abort();
  eligibility.cancel();
  if (ownConfirmation && confirmation.current.value === ownConfirmation) confirmation.clear();
  ownConfirmation = null;
}
watch(
  context,
  () => {
    cancel();
    lifetime = new AbortController();
    busy.value = null;
    operationError.value = null;
    items.value = [];
    error.value = null;
    list.totalCount.value = 0;
    injector.runInContext(gdprExtensionsResolver);
    list.get();
    void checkRequestAllowed();
  },
  { flush: 'sync' },
);
onScopeDispose(cancel);
void checkRequestAllowed();
</script>
