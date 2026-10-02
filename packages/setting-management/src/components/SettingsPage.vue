<script setup lang="ts">
import { AbpPage, AbpTabList } from '@lsw-abpvue/components';
import { useSettingTabs } from '@lsw-abpvue/setting-management/config';
import { computed, ref, watch } from 'vue';

const tabs = useSettingTabs();

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
    <p v-if="!visible.length" class="abp-settings__panel text-body-secondary">
      {{ $t('AbpSettingManagement::NoSettingsAvailable') }}
    </p>

    <div v-else class="abp-settings">
      <AbpTabList
        v-model="selected"
        :items="visible"
        :aria-label="$t('AbpSettingManagement::Settings')"
      />

      <div class="abp-settings__panel" role="tabpanel">
        <component :is="current.component" v-if="current" :key="current.name" />
      </div>
    </div>
  </AbpPage>
</template>
