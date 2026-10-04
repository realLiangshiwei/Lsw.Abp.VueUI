<template>
  <UsersPage />
  <AbpModal v-model:visible="visible" aria-label="User details">
    <template #header><h2 class="h5 mb-0">User details</h2></template>
    <dl v-if="record">
      <dt>User name</dt>
      <dd>{{ record.userName }}</dd>
      <dt>Email</dt>
      <dd>{{ record.email }}</dd>
    </dl>
    <template #footer="{ close }"
      ><AbpButton variant="secondary" @click="close">Close</AbpButton></template
    >
  </AbpModal>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { inject } from '@lsw-abpvue/core';
import { UsersPage } from '@lsw-abpvue/identity';
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';
import { UserDetailsService } from './user-details';
const service = inject(UserDetailsService);
const { visible, record } = service;
onBeforeUnmount(service.close);
</script>
