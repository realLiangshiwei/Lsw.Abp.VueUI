<script setup lang="ts">
import { ROW_RECORD } from '@lsw-abpvue/components';
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import type { Ref } from 'vue';

/**
 * The user name, with the marker ABP puts on a deactivated account. A component rather
 * than an HTML string: nothing in this UI renders markup a contributor produced.
 */
const user = injectAbp(ROW_RECORD) as Ref<IdentityUserDto>;
const localization = useLocalization();
</script>

<template>
  <i
    v-if="!user.isActive"
    class="bi bi-slash-circle text-danger me-1"
    :title="localization.t('AbpIdentity::ThisUserIsNotActiveMessage')"
  />
  <span :class="{ 'text-body-secondary': !user.isActive }">{{ user.userName }}</span>
</template>
