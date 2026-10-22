<template>
  <span>
    <span>{{ record.name }}</span>
    <span v-if="record.isDefault" class="badge rounded-pill bg-success ms-1">
      {{ $t('AbpIdentity::DisplayName:IsDefault') }}
    </span>
    <span v-if="record.isPublic" class="badge rounded-pill bg-info ms-1">
      {{ $t('AbpIdentity::DisplayName:IsPublic') }}
    </span>
  </span>
</template>

<script setup lang="ts">
import type { IdentityRoleDto } from '@lsw-abpvue/identity-pro/proxy';

defineProps<{ record: IdentityRoleDto }>();
</script>
