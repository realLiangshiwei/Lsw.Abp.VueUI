<script setup lang="ts">
import { useThemeMode } from '../../services/theme-mode.service.js';

const themeMode = useThemeMode();
</script>

<template>
  <li class="nav-item">
    <button
      type="button"
      class="btn btn-link nav-link"
      :aria-label="$t('AbpUi::Theme')"
      :aria-pressed="themeMode.resolved.value === 'dark' ? 'true' : 'false'"
      @click="themeMode.toggle()"
    >
      <i
        class="bi"
        :class="themeMode.resolved.value === 'dark' ? 'bi-sun' : 'bi-moon-stars'"
        aria-hidden="true"
      />
    </button>
  </li>
</template>
