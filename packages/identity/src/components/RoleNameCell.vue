<script setup lang="ts">
import { ROW_RECORD } from '@lsw-abpvue/components';
import { inject as injectAbp } from '@lsw-abpvue/core';
import type { IdentityRoleDto } from '@lsw-abpvue/identity/proxy';
import type { Ref } from 'vue';

const role = injectAbp(ROW_RECORD) as Ref<IdentityRoleDto>;
</script>

<template>
  <span>
    {{ role.name }}
    <span v-if="role.isDefault" class="badge rounded-pill text-bg-success ms-1">
      {{ $t('AbpIdentity::DisplayName:IsDefault') }}
    </span>
    <span v-if="role.isPublic" class="badge rounded-pill text-bg-info ms-1">
      {{ $t('AbpIdentity::DisplayName:IsPublic') }}
    </span>
  </span>
</template>
