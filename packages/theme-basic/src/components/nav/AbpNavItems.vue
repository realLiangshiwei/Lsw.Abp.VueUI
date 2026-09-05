<script setup lang="ts">
import { useNavItems } from '@lsw-abpvue/theme-shared';

/** The right-hand side of the navbar, whatever anyone registered into it. */
const navItems = useNavItems();
</script>

<template>
  <ul class="navbar-nav ms-auto align-items-center">
    <template v-for="item in navItems.visible.value" :key="item.name">
      <component :is="item.component" v-if="item.component" />
      <li v-else class="nav-item">
        <button type="button" class="btn btn-link nav-link" @click="item.action?.()">
          <i v-if="item.iconClass" :class="item.iconClass" aria-hidden="true" />
          <span v-if="item.text" class="ms-1">{{ $t(item.text) }}</span>
        </button>
      </li>
    </template>
  </ul>
</template>
