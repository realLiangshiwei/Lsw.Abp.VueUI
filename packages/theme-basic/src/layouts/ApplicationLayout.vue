<script setup lang="ts">
import { useLocalization, useReplaceableComponents, WindowService } from '@lsw-abpvue/core';
import { inject as injectAbp, StorageService } from '@lsw-abpvue/core';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AbpBreadcrumb from '../components/AbpBreadcrumb.vue';
import AbpConfirmHost from '../components/AbpConfirmHost.vue';
import AbpErrorPage from '../components/AbpErrorPage.vue';
import AbpLoaderBar from '../components/AbpLoaderBar.vue';
import AbpPageAlerts from '../components/AbpPageAlerts.vue';
import AbpToastHost from '../components/AbpToastHost.vue';
import AbpLogo from '../components/nav/AbpLogo.vue';
import AbpNavItems from '../components/nav/AbpNavItems.vue';
import AbpRoutes from '../components/nav/AbpRoutes.vue';
import { ThemeBasicComponents } from '../enums/components.js';

const COLLAPSED_KEY = 'abpThemeBasicSidebarCollapsed';
const DRAWER_WIDTH = 992;

const storage = injectAbp(StorageService);
const windowService = injectAbp(WindowService);
const replaceable = useReplaceableComponents();
const localization = useLocalization();
const route = useRoute();

const collapsed = ref(storage.getItem(COLLAPSED_KEY) === 'true');
const drawerOpen = ref(false);

// Under this width the sidebar is a drawer over the page rather than a column beside it.
const narrow = ref(
  (windowService.nativeWindow?.innerWidth ?? Number.POSITIVE_INFINITY) < DRAWER_WIDTH,
);
const onResize = () => {
  narrow.value =
    (windowService.nativeWindow?.innerWidth ?? Number.POSITIVE_INFINITY) < DRAWER_WIDTH;
};
windowService.nativeWindow?.addEventListener('resize', onResize);

watch(collapsed, value => storage.setItem(COLLAPSED_KEY, String(value)));
// A drawer that stayed open over the page it just navigated to would hide it.
watch(
  () => route.path,
  () => (drawerOpen.value = false),
);

const logo = computed(() => replaceable.getRef(ThemeBasicComponents.Logo).value ?? AbpLogo);
const routes = computed(() => replaceable.getRef(ThemeBasicComponents.Routes).value ?? AbpRoutes);
const navItems = computed(
  () => replaceable.getRef(ThemeBasicComponents.NavItems).value ?? AbpNavItems,
);

function toggleSidebar(): void {
  if (narrow.value) drawerOpen.value = !drawerOpen.value;
  else collapsed.value = !collapsed.value;
}
</script>

<template>
  <AbpLoaderBar />

  <div class="abp-shell" :class="{ 'abp-shell--collapsed': collapsed && !narrow }">
    <aside
      class="abp-shell__sidebar"
      :class="{ 'abp-shell__sidebar--drawer': narrow, 'abp-shell__sidebar--open': drawerOpen }"
      :inert="narrow && !drawerOpen ? true : undefined"
    >
      <component :is="routes" />
    </aside>

    <!-- Focusable rather than a bare div: dismissing the drawer has to be reachable. -->
    <button
      v-if="narrow && drawerOpen"
      type="button"
      class="abp-shell__scrim"
      :aria-label="localization.t('AbpUi::Close')"
      @click="drawerOpen = false"
    />

    <div class="abp-shell__main">
      <!-- `navbar-expand` keeps `navbar-nav` a row: without it Bootstrap stacks it and
           the navbar wraps the whole right-hand side onto a second line. -->
      <nav class="navbar navbar-expand flex-nowrap bg-body-tertiary px-3">
        <button
          type="button"
          class="btn btn-link"
          :aria-expanded="narrow ? drawerOpen : !collapsed"
          :aria-label="localization.t('AbpUi::Menu')"
          @click="toggleSidebar"
        >
          <i class="bi bi-list" aria-hidden="true" />
        </button>

        <component :is="logo" />
        <component :is="navItems" />
      </nav>

      <main class="p-3" @keydown.esc="drawerOpen = false">
        <AbpPageAlerts />
        <AbpBreadcrumb />
        <slot />
      </main>
    </div>
  </div>

  <AbpToastHost />
  <AbpConfirmHost />
  <AbpErrorPage />
</template>

<style scoped>
.abp-shell {
  display: grid;
  grid-template-columns: var(--abp-sidebar-width) 1fr;
  min-height: 100vh;
}

.abp-shell--collapsed {
  grid-template-columns: 0 1fr;
}

/* Zero width still leaves the padding and the border showing as a sliver. */
.abp-shell--collapsed .abp-shell__sidebar {
  display: none;
}

.abp-shell__sidebar {
  overflow: hidden auto;
  padding: 1rem;
  background: var(--abp-sidebar-bg);
  border-inline-end: 1px solid var(--abp-sidebar-border);
}

.abp-shell__sidebar--drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: 1045;
  width: var(--abp-sidebar-width);
  transform: translateX(-100%);
  transition: transform 0.2s ease;
}

.abp-shell__sidebar--open {
  transform: translateX(0);
}

.abp-shell__scrim {
  position: fixed;
  inset: 0;
  z-index: 1040;
  border: 0;
  background: var(--abp-scrim);
}

.abp-shell__main {
  min-width: 0;
}

@media (max-width: 991.98px) {
  .abp-shell {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .abp-shell__sidebar--drawer {
    transition: none;
  }
}

/* The drawer slides from the other edge when the document reads right to left. */
[dir='rtl'] .abp-shell__sidebar--drawer {
  transform: translateX(100%);
}

[dir='rtl'] .abp-shell__sidebar--open {
  transform: translateX(0);
}
</style>
