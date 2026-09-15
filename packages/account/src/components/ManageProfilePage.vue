<script setup lang="ts">
import { useManageProfileState, useManageProfileTabs } from '@lsw-abpvue/account-core';
import { ProfileService } from '@lsw-abpvue/account-core/proxy';
import { AbpPage } from '@lsw-abpvue/components';
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, onMounted, ref } from 'vue';

const profiles = injectAbp(ProfileService);
const state = useManageProfileState();
const tabs = useManageProfileTabs();
const localization = useLocalization();

const loading = ref(true);
const selected = ref('');

const visible = computed(() => tabs.visible.value);
const current = computed(() => visible.value.find(tab => tab.name === selected.value));

onMounted(async () => {
  try {
    state.set(await profiles.get());
  } finally {
    loading.value = false;
  }

  // Picked after the profile is in: which tabs there are depends on it -- an account
  // that signs in through an external provider has no password to change.
  selected.value = visible.value[0]?.name ?? '';
});
</script>

<template>
  <AbpPage title="AbpAccount::MyAccount">
    <AbpSpinner v-if="loading" />

    <div v-else class="abp-profile">
      <div
        class="abp-profile__tabs"
        role="tablist"
        aria-orientation="vertical"
        :aria-label="$t('AbpAccount::MyAccount')"
      >
        <button
          v-for="tab in visible"
          :key="tab.name"
          type="button"
          role="tab"
          class="abp-profile__tab"
          :class="{ 'abp-profile__tab--active': tab.name === selected }"
          :aria-selected="tab.name === selected"
          :tabindex="tab.name === selected ? 0 : -1"
          @click="selected = tab.name"
        >
          <i v-if="tab.iconClass" :class="tab.iconClass" aria-hidden="true" />
          {{ localization.t(tab.text) }}
        </button>
      </div>

      <div class="abp-profile__panel" role="tabpanel">
        <component :is="current.component" v-if="current" :key="current.name" />
      </div>
    </div>
  </AbpPage>
</template>
