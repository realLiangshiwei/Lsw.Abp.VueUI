<script setup lang="ts">
import { ROW_RECORD } from '@lsw-abpvue/components';
import { inject as injectAbp } from '@lsw-abpvue/core';
import { computed } from 'vue';
import type { DemoUserDto } from '../modules/identity-demo/services/users.service';

/**
 * A cell the host contributed. It takes the row as a prop, and could equally read it
 * from `ROW_RECORD` -- which is the channel for a component that is not in the page's
 * template (design 05 §7). Both are shown here on purpose.
 */
const props = defineProps<{ record: DemoUserDto }>();

const fromToken = injectAbp(ROW_RECORD, { optional: true });
const record = computed(() => (fromToken?.value as DemoUserDto | undefined) ?? props.record);

const roles = computed(() => (record.value.userName === 'admin' ? ['admin'] : ['user']));
</script>

<template>
  <span v-for="role in roles" :key="role" class="badge text-bg-secondary me-1">{{ role }}</span>
</template>
