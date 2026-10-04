<template>
  <div class="vp-raw docs-demo" :data-bs-theme="isDark ? 'dark' : 'light'">
    <div ref="host" />
    <p class="docs-demo__note">{{ note }}</p>
  </div>
</template>

<script setup lang="ts">
import {
  createApp,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  type App,
  type Component,
} from 'vue';
import { useData } from 'vitepress';
import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  LocalizationService,
  provideAbpCore,
  withLocalizations,
  withOptions,
  type Injector,
} from '@lsw-abpvue/core';
import { provideThemeBasicComponents } from '@lsw-abpvue/theme-basic';

const props = defineProps<{ example: Component; note?: string | undefined }>();
const { isDark } = useData();
const host = useTemplateRef<HTMLDivElement>('host');
let demo: App | undefined;
let injector: Injector | undefined;

onMounted(() => {
  if (!host.value) return;
  // Each example has its own services and cleanup; no backend initialization runs.
  injector = createInjector([
    provideAbpCore(
      withOptions({
        environment: {
          production: false,
          application: { name: 'Examples' },
          apis: { default: { url: '' } },
        },
      }),
      withLocalizations([
        {
          culture: 'en',
          resources: [
            {
              resourceName: 'AbpUi',
              texts: {
                Save: 'Save',
                Cancel: 'Cancel',
                Yes: 'Yes',
                No: 'No',
                Close: 'Close',
                Actions: 'Actions',
                AreYouSure: 'Are you sure?',
                AreYouSureYouWantToCancelEditingWarningMessage: 'Discard your unsaved changes?',
                PagerInfo: 'Showing {0} to {1} of {2} entries',
                'PagerInfo{0}{1}{2}': 'Showing {0} to {1} of {2} entries',
              },
            },
          ],
        },
      ]),
    ),
    provideThemeBasicComponents(),
  ]);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    localization: {
      ...state.localization,
      currentCulture: { ...state.localization.currentCulture, cultureName: 'en' },
    },
  });
  const localization = injector.get(LocalizationService);
  demo = createApp(props.example);
  demo.provide(ABP_INJECTOR_KEY, injector);
  demo.config.globalProperties.$t = localization.t;
  demo.mount(host.value);
});

onBeforeUnmount(() => {
  demo?.unmount();
  injector?.destroy();
});
</script>
