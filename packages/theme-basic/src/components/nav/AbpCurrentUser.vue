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
import { useDirection } from '../../services/direction.service.js';

const currentUser = useCurrentUser();
const auth = injectAbp(AuthService, { optional: true });
const userMenu = useUserMenu();
const localization = useLocalization();
const router = useRouter();
const { direction } = useDirection();

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
    <DropdownMenuRoot :dir="direction">
      <DropdownMenuTrigger class="btn btn-link nav-link">
        <i class="bi bi-person-circle" aria-hidden="true" />
        <span class="ms-1">{{ name }}</span>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          class="abp-menu abp-nav-menu dropdown-menu show"
          align="end"
          :side-offset="8"
          :collision-padding="12"
        >
          <DropdownMenuItem v-for="item in userMenu.visible.value" :key="item.name" as-child>
            <button type="button" class="dropdown-item" @click="activate(item)">
              <i v-if="item.iconClass" :class="item.iconClass" aria-hidden="true" />
              <span class="ms-1">{{ localization.t(item.text ?? item.name) }}</span>
            </button>
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
