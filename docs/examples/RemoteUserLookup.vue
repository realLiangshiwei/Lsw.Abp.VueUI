<template>
  <AbpPage title="AbpIdentity::Users">
    <AbpFormField v-slot="{ id, describedBy }" label="Assigned user" hint="Search by username">
      <AbpTypeahead
        :id="id"
        v-model="userId"
        v-model:display-value="userName"
        :search="search"
        :disabled="loadingRecord"
        :aria-describedby="describedBy"
        :min-length="2"
        clearable
      >
        <template #item="{ item }"
          ><strong>{{ item.label }}</strong></template
        >
        <template #empty>{{
          searchFailed ? 'Search failed. Edit the query to retry.' : 'No matching user'
        }}</template>
      </AbpTypeahead>
    </AbpFormField>
    <p v-if="recordFailed" role="alert">
      The selected user could not be loaded.
      <AbpButton variant="secondary" size="sm" @click="loadSelectedUser">Retry</AbpButton>
    </p>
    <output>Assigned user id: {{ userId ?? 'none' }}</output>
  </AbpPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { inject, useCurrentUser } from '@lsw-abpvue/core';
import { AbpPage } from '@lsw-abpvue/components';
import { IdentityUserService } from '@lsw-abpvue/identity/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpTypeahead,
  type AbpTypeaheadItem,
} from '@lsw-abpvue/theme-shared';

const users = inject(IdentityUserService);
const initialUserId = useCurrentUser().user.value.id;
const userId = ref<string | null>(initialUserId ?? null);
const userName = ref('');
const loadingRecord = ref(false);
const recordFailed = ref(false);
const searchFailed = ref(false);
const recordRequest = new AbortController();
onBeforeUnmount(() => recordRequest.abort());
onMounted(loadSelectedUser);

async function loadSelectedUser(): Promise<void> {
  if (!initialUserId || loadingRecord.value) return;
  loadingRecord.value = true;
  recordFailed.value = false;
  try {
    const user = await users.get(initialUserId, { signal: recordRequest.signal });
    userId.value = user.id ?? null;
    userName.value = user.userName ?? '';
  } catch {
    if (!recordRequest.signal.aborted) recordFailed.value = true;
  } finally {
    loadingRecord.value = false;
  }
}

async function search(term: string, signal: AbortSignal): Promise<readonly AbpTypeaheadItem[]> {
  searchFailed.value = false;
  try {
    const result = await users.getList(
      { filter: term, sorting: 'userName', skipCount: 0, maxResultCount: 10 },
      { signal },
    );
    return result.items.flatMap(user =>
      user.id ? [{ value: user.id, label: user.userName ?? user.id }] : [],
    );
  } catch {
    // The control expects a resolved list; RestService has already reported a real failure.
    if (!signal.aborted) searchFailed.value = true;
    return [];
  }
}
</script>
