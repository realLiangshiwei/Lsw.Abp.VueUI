<script setup lang="ts">
import {
  AuthService,
  inject as injectAbp,
  useCurrentUser,
  useLocalization,
} from '@lsw-abpvue/core';
import { useUserMenu, type NavItem } from '@lsw-abpvue/theme-shared';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const currentUser = useCurrentUser();
const auth = injectAbp(AuthService, { optional: true });
const userMenu = useUserMenu();
const localization = useLocalization();
const router = useRouter();

const name = computed(() => currentUser.user.value.userName ?? '');

async function activate(item: NavItem): Promise<void> {
  if (item.path) {
    await router.push(item.path);
    return;
  }

  await item.action?.();
}
</script>

<template>
  <li v-if="currentUser.isAuthenticated.value" class="nav-item">
    <DropdownMenuRoot>
      <DropdownMenuTrigger class="btn btn-link nav-link">
        <i class="bi bi-person-circle" aria-hidden="true" />
        <span class="ms-1">{{ name }}</span>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent class="abp-menu dropdown-menu show" align="end" :side-offset="4">
          <DropdownMenuItem
            v-for="item in userMenu.visible.value"
            :key="item.name"
            class="dropdown-item"
            @select="activate(item)"
          >
            <i v-if="item.iconClass" :class="item.iconClass" aria-hidden="true" />
            <span class="ms-1">{{ localization.t(item.text ?? item.name) }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </li>
  <li v-else-if="auth" class="nav-item">
    <button type="button" class="btn btn-link nav-link" @click="auth.navigateToLogin()">
      {{ localization.t('AbpAccount::Login') }}
    </button>
  </li>
</template>

<style scoped>
.abp-menu {
  z-index: 1085;
}
</style>
