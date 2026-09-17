<script setup lang="ts">
import { ROW_RECORD } from '@lsw-abpvue/components';
import { inject as injectAbp } from '@lsw-abpvue/core';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { computed, type Ref } from 'vue';

/** A cell the host brought. It reads the row through the token the table provides. */
const user = injectAbp(ROW_RECORD) as Ref<IdentityUserDto>;

const fullName = computed(() =>
  [user.value.name, user.value.surname].filter(Boolean).join(' ').trim(),
);
</script>

<template>
  <span :class="{ 'text-body-secondary': !fullName }">{{ fullName || '—' }}</span>
</template>
