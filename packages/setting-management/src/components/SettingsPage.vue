<script setup lang="ts">
import { AbpPage } from '@lsw-abpvue/components';
import { useLocalization } from '@lsw-abpvue/core';
import { useSettingTabs } from '@lsw-abpvue/setting-management/config';
import { computed, ref, watch } from 'vue';

const tabs = useSettingTabs();
const localization = useLocalization();

const selected = ref('');

const visible = computed(() => tabs.visible.value);
const current = computed(() => visible.value.find(tab => tab.name === selected.value));

// Which tabs there are depends on the permissions and features that arrive with the
// configuration, so the first one is picked once there is one -- and again if the tab in
// front of you stops being visible.
watch(
  visible,
  next => {
    if (!next.some(tab => tab.name === selected.value)) selected.value = next[0]?.name ?? '';
  },
  { immediate: true },
);
</script>

<template>
  <AbpPage title="AbpSettingManagement::Settings">
    <p v-if="!visible.length" class="text-body-secondary">
      {{ $t('AbpSettingManagement::NoSettingsAvailable') }}
    </p>

    <div v-else class="abp-settings">
      <div
        class="abp-settings__tabs"
        role="tablist"
        aria-orientation="vertical"
        :aria-label="$t('AbpSettingManagement::Settings')"
      >
        <button
          v-for="tab in visible"
          :key="tab.name"
          type="button"
          role="tab"
          class="abp-settings__tab"
          :class="{ 'abp-settings__tab--active': tab.name === selected }"
          :aria-selected="tab.name === selected"
          :tabindex="tab.name === selected ? 0 : -1"
          @click="selected = tab.name"
        >
          <i v-if="tab.iconClass" :class="tab.iconClass" aria-hidden="true" />
          {{ localization.t(tab.text ?? tab.name) }}
        </button>
      </div>

      <div class="abp-settings__panel" role="tabpanel">
        <component :is="current.component" v-if="current" :key="current.name" />
      </div>
    </div>
  </AbpPage>
</template>
