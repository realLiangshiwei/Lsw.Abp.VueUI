<script setup lang="ts">
import { ConfigStateService, inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { FeaturesService, type FeatureGroupDto } from '@lsw-abpvue/feature-management/proxy';
import {
  AbpButton,
  AbpInput,
  AbpModal,
  AbpSelect,
  AbpSpinner,
  AbpToggle,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, ref, shallowRef, watch } from 'vue';
import { FeatureValueTypes, type EditableFeature } from '../models/feature.js';
import {
  changedFeatures,
  flattenFeatures,
  freeTextBounds,
  freeTextInputType,
  INDENT_STEP,
  isFeatureDisabled,
  isOn,
  selectionItemKey,
  selectionItemsOf,
  setFeatureValue,
} from '../utils/features.js';

const props = withDefaults(
  defineProps<{
    /** `T` for a tenant, or whatever a module registered. */
    providerName: string;
    /** Which tenant; left out for the host's own features. */
    providerKey?: string | undefined;
    /** What the heading names, next to "Features". */
    providerTitle?: string | undefined;
  }>(),
  { providerKey: undefined, providerTitle: undefined },
);

const visible = defineModel<boolean>('visible', { default: false });

const features = injectAbp(FeaturesService);
const configState = injectAbp(ConfigStateService);
const localization = useLocalization();
const confirmation = useConfirmation();
const toaster = useToaster();

const groups = shallowRef<FeatureGroupDto[]>([]);
const working = shallowRef<EditableFeature[]>([]);
const selectedGroup = ref('');
const loading = ref(false);
const busy = ref(false);

const title = computed(() =>
  [localization.t('AbpFeatureManagement::Features'), props.providerTitle]
    .filter(Boolean)
    .join(' - '),
);

const shown = computed(() =>
  working.value.filter(feature => feature.groupName === selectedGroup.value),
);

const selectedGroupName = computed(
  () => groups.value.find(group => group.name === selectedGroup.value)?.displayName ?? '',
);

async function load(): Promise<void> {
  loading.value = true;

  try {
    const result = await features.get(props.providerName, props.providerKey ?? '');
    groups.value = result.groups ?? [];
    working.value = flattenFeatures(groups.value);
    selectedGroup.value = groups.value[0]?.name ?? '';
  } finally {
    loading.value = false;
  }
}

// Opening is what fetches, and immediate because a dialog can be mounted already open.
watch(
  visible,
  isOpen => {
    if (isOpen) void load();
  },
  { immediate: true },
);

const disabled = (feature: EditableFeature): boolean =>
  isFeatureDisabled(working.value, feature, props.providerName);

const optionsOf = (feature: EditableFeature) =>
  selectionItemsOf(feature).map(item => ({
    value: item.value ?? '',
    label: localization.t(selectionItemKey(item)),
  }));

function set(feature: EditableFeature, value: string): void {
  working.value = setFeatureValue(working.value, feature.name ?? '', value);
}

/** Only the host's own features are part of this application's configuration. */
const changesThisApplication = (): boolean => !props.providerKey;

async function save(): Promise<void> {
  const changed = changedFeatures(working.value);
  if (changed.length === 0) {
    visible.value = false;
    return;
  }

  busy.value = true;

  try {
    await features.update(props.providerName, props.providerKey ?? '', { features: changed });
    visible.value = false;
    if (changesThisApplication()) await configState.refreshAppState();
    toaster.success('AbpUi::SavedSuccessfully');
  } finally {
    busy.value = false;
  }
}

async function resetToDefault(): Promise<void> {
  const answer = await confirmation.warn(
    'AbpFeatureManagement::AreYouSureToResetToDefault',
    'AbpFeatureManagement::AreYouSure',
  );
  if (answer !== ConfirmationStatus.confirm) return;

  busy.value = true;

  try {
    await features.delete(props.providerName, props.providerKey ?? '');
    visible.value = false;
    if (changesThisApplication()) await configState.refreshAppState();
    toaster.success('AbpFeatureManagement::ResetedToDefault');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AbpModal v-model:visible="visible" size="lg" :busy="busy" suppress-unsaved-changes-warning>
    <template #header>
      <h2 class="h5 mb-0">{{ title }}</h2>
    </template>

    <AbpSpinner v-if="loading" />

    <p v-else-if="!groups.length">{{ $t('AbpFeatureManagement::NoFeatureFoundMessage') }}</p>

    <div v-else class="abp-features">
      <div
        class="abp-features__groups"
        role="tablist"
        aria-orientation="vertical"
        :aria-label="$t('AbpFeatureManagement::Features')"
      >
        <button
          v-for="group in groups"
          :key="group.name"
          type="button"
          role="tab"
          class="abp-features__group"
          :class="{ 'abp-features__group--active': group.name === selectedGroup }"
          :aria-selected="group.name === selectedGroup"
          :tabindex="group.name === selectedGroup ? 0 : -1"
          @click="selectedGroup = group.name ?? ''"
        >
          {{ group.displayName }}
        </button>
      </div>

      <div class="abp-features__list" role="tabpanel">
        <h3 class="h6">{{ selectedGroupName }}</h3>
        <hr />

        <div
          v-for="feature in shown"
          :key="feature.name"
          class="abp-features__feature"
          :style="{ marginInlineStart: `${feature.depth * INDENT_STEP}px` }"
        >
          <AbpToggle
            v-if="feature.valueType?.name === FeatureValueTypes.Toggle"
            :model-value="isOn(feature)"
            :disabled="disabled(feature)"
            :label="feature.displayName"
            @update:model-value="set(feature, $event === true ? 'true' : 'false')"
          />

          <label v-else class="abp-features__label" :for="`feature-${feature.name}`">
            {{ feature.displayName }}
          </label>

          <AbpInput
            v-if="feature.valueType?.name === FeatureValueTypes.FreeText"
            :id="`feature-${feature.name}`"
            :model-value="feature.value"
            :type="freeTextInputType(feature)"
            :min="freeTextBounds(feature).min"
            :max="freeTextBounds(feature).max"
            :disabled="disabled(feature)"
            @update:model-value="set(feature, String($event ?? ''))"
          />

          <AbpSelect
            v-else-if="feature.valueType?.name === FeatureValueTypes.Selection"
            :id="`feature-${feature.name}`"
            :model-value="feature.value"
            :options="optionsOf(feature)"
            :disabled="disabled(feature)"
            @update:model-value="set(feature, String($event ?? ''))"
          />

          <p v-if="feature.description" class="abp-features__description">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <AbpButton variant="secondary" outline :disabled="busy" @click="visible = false">
        {{ $t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton
        v-if="groups.length"
        variant="secondary"
        outline
        :disabled="busy"
        @click="resetToDefault"
      >
        {{ $t('AbpFeatureManagement::ResetToDefault') }}
      </AbpButton>
      <AbpButton v-if="groups.length" variant="primary" :loading="busy" @click="save">
        {{ $t('AbpUi::Save') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>
