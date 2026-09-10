<script setup lang="ts">
import type { DemoUserDto } from '../services/users.service.js';

defineProps<{ record: DemoUserDto }>();
</script>

<template>
  <!-- Twelve lines instead of a string of HTML: the same column ABP renders with
       `innerHTML`, with no way for a value to become markup. -->
  <span :class="{ 'text-muted': !record.isActive }">
    <i
      v-if="!record.isActive"
      class="bi bi-slash-circle text-danger me-1"
      :title="$t('AbpIdentity::ThisUserIsNotActiveMessage')"
      aria-hidden="true"
    />
    {{ record.userName }}
  </span>
</template>
