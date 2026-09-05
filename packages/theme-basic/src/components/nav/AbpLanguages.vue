<script setup lang="ts">
import { useLocalization } from '@lsw-abpvue/core';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui';
import { computed } from 'vue';

const localization = useLocalization();

const others = computed(() =>
  localization.languages.value.filter(
    language => language.cultureName !== localization.currentLang.value,
  ),
);

const currentName = computed(
  () =>
    localization.languages.value.find(
      language => language.cultureName === localization.currentLang.value,
    )?.displayName ?? localization.currentLang.value,
);
</script>

<template>
  <li v-if="others.length > 0" class="nav-item">
    <DropdownMenuRoot>
      <DropdownMenuTrigger class="btn btn-link nav-link" :aria-label="$t('AbpUi::Language')">
        <i class="bi bi-translate" aria-hidden="true" />
        <span class="ms-1">{{ currentName }}</span>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent class="abp-menu dropdown-menu show" align="end" :side-offset="4">
          <DropdownMenuItem
            v-for="language in others"
            :key="language.cultureName ?? language.displayName ?? ''"
            class="dropdown-item"
            @select="localization.setLanguage(language.cultureName ?? '')"
          >
            {{ language.displayName }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </li>
</template>

<style scoped>
.abp-menu {
  z-index: 1085;
}
</style>
