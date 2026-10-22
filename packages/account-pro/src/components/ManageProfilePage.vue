<template>
  <AbpPage title="AbpAccount::MyAccount">
    <p v-if="failed" role="alert">{{ $t('AbpUi::DefaultErrorMessage') }}</p>
    <AbpButton v-if="failed" :disabled="busy" @click="load">{{ $t('AbpUi::Refresh') }}</AbpButton>
    <AbpSpinner v-if="busy" />
    <template v-if="state.profile.value">
      <div class="row g-4">
        <div class="col-md-3">
          <AbpTabList
            v-model="selected"
            :items="tabs.visible.value"
            :aria-label="$t('AbpAccount::MyAccount')"
          />
        </div>
        <div class="col-md-9" role="tabpanel">
          <AbpReplaceable v-if="current" :replaceable-key="current.name">
            <AbpReplaceable :replaceable-key="keys[current.name] ?? current.name">
              <component :is="current.component" :key="current.name" />
            </AbpReplaceable>
          </AbpReplaceable>
        </div>
      </div>
    </template>
  </AbpPage>
</template>
<script setup lang="ts">
import { useManageProfileTabs } from '@lsw-abpvue/account-core';
import {
  AccountProProfileStateService,
  AccountProProfileTabs,
} from '@lsw-abpvue/account-pro/config';
import { ProfileService } from '@lsw-abpvue/account-pro/proxy';
import { AbpPage, AbpTabList } from '@lsw-abpvue/components';
import { AbpReplaceable, ConfigStateService, inject as injectAbp } from '@lsw-abpvue/core';
import { AbpButton, AbpSpinner } from '@lsw-abpvue/theme-shared';
import { computed, ref, watch } from 'vue';
import { useAccountOperation } from '../utils/use-account-operation.js';

const service = injectAbp(ProfileService);
const state = injectAbp(AccountProProfileStateService);
const config = injectAbp(ConfigStateService);
const tabs = useManageProfileTabs();
const selected = ref('');
const keys: Record<string, string> = {
  [AccountProProfileTabs.PersonalInfo]: 'Account.PersonalSettingsComponent',
  [AccountProProfileTabs.ProfilePicture]: 'Account.ProfilePicture',
  [AccountProProfileTabs.ChangePassword]: 'Account.ChangePasswordComponent',
};
const current = computed(() => tabs.visible.value.find(tab => tab.name === selected.value));
const { busy, failed, run } = useAccountOperation();
function load(): Promise<boolean> {
  return run(
    async signal => {
      const profile = await service.get({ signal });
      const canEnable = await service.canEnableTwoFactor({ signal });
      return { profile, canEnable };
    },
    ({ profile, canEnable }) => state.set(profile, canEnable),
  );
}
watch(
  () => tabs.visible.value,
  visible => {
    if (!visible.some(tab => tab.name === selected.value)) selected.value = visible[0]?.name ?? '';
  },
  { immediate: true },
);
watch(
  [() => config.snapshot().currentUser.id, () => config.snapshot().currentTenant.id],
  () => {
    state.set(null);
    void load();
  },
  { immediate: true },
);
</script>
