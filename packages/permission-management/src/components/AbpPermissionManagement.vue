<script setup lang="ts">
import {
  ConfigStateService,
  inject as injectAbp,
  useLocalization,
  type CurrentUserDto,
} from '@lsw-abpvue/core';
import {
  PermissionsService,
  type GetPermissionListResultDto,
  type PermissionGroupDto,
} from '@lsw-abpvue/permission-management/proxy';
import {
  AbpButton,
  AbpInput,
  AbpModal,
  AbpSpinner,
  AbpToggle,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, ref, shallowRef, watch } from 'vue';
import type { GroupedPermission } from '../models/permission.js';
import {
  changesBetween,
  checkboxState,
  flatten,
  INDENT_STEP,
  isGrantedElsewhere,
  isSelectAllDisabled,
  matchingGroups,
  setMany,
  toggle,
} from '../utils/permissions.js';

const props = withDefaults(
  defineProps<{
    /** `U` for a user, `R` for a role, or whatever a module registered. */
    providerName: string;
    /** Which user or role, as its id or name. */
    providerKey: string;
    /** What the heading names; the server's own answer is used when there is none. */
    entityDisplayName?: string | undefined;
    /** Leaves out the "granted by" markers next to an inherited permission. */
    hideBadges?: boolean | undefined;
  }>(),
  { entityDisplayName: undefined, hideBadges: false },
);

const visible = defineModel<boolean>('visible', { default: false });

const permissions = injectAbp(PermissionsService);
const configState = injectAbp(ConfigStateService);
const localization = useLocalization();
const toaster = useToaster();

const answer = shallowRef<GetPermissionListResultDto>();
const working = shallowRef<GroupedPermission[]>([]);
const original = shallowRef<GroupedPermission[]>([]);
const selectedGroup = ref('');
const filter = ref('');
const busy = ref(false);
const loading = ref(false);

const groups = computed(() => matchingGroups(answer.value?.groups ?? [], filter.value));

const title = computed(() =>
  [
    localization.t('AbpPermissionManagement::Permissions'),
    props.entityDisplayName || answer.value?.entityDisplayName,
  ]
    .filter(Boolean)
    .join(' - '),
);

const shown = computed(() =>
  working.value.filter(permission => permission.groupName === selectedGroup.value),
);

const allState = computed(() => checkboxState(working.value));
const groupState = computed(() => checkboxState(shown.value));
const allDisabled = computed(() => isSelectAllDisabled(working.value, props.providerName));
const groupDisabled = computed(() => isSelectAllDisabled(shown.value, props.providerName));

function grantedCount(group: PermissionGroupDto): number {
  return working.value.filter(
    permission => permission.groupName === group.name && permission.isGranted,
  ).length;
}

async function load(): Promise<void> {
  loading.value = true;

  try {
    const result = await permissions.get(props.providerName, props.providerKey);
    answer.value = result;
    original.value = flatten(result.groups ?? []);
    working.value = original.value;
    selectedGroup.value = result.groups?.[0]?.name ?? '';
    filter.value = '';
  } finally {
    loading.value = false;
  }
}

// Opening is what fetches: the permissions of a user are asked for when someone asks to
// see them, not when the page that can show them is rendered. Immediate, because a
// dialog can be mounted already open.
watch(
  visible,
  isOpen => {
    if (isOpen) void load();
  },
  { immediate: true },
);

// A filter that hides the tab in front of you leaves you looking at nothing.
watch(groups, next => {
  if (!next.some(group => group.name === selectedGroup.value)) {
    selectedGroup.value = next[0]?.name ?? '';
  }
});

function setAllInGroup(): void {
  const names = new Set(shown.value.map(permission => permission.name ?? ''));
  const granting = !groupState.value.checked;
  working.value = setMany(working.value, names, granting, props.providerName);
}

function setAll(): void {
  const names = new Set(working.value.map(permission => permission.name ?? ''));
  const granting = !allState.value.checked;
  working.value = setMany(working.value, names, granting, props.providerName);
}

/**
 * Whether this change is about the person making it, which is the one case where the
 * application's own configuration has to be reloaded before the menu is right again.
 */
function changesCurrentUser(): boolean {
  const user = configState.getOne('currentUser').value as CurrentUserDto;

  if (props.providerName === 'U') return user.id === props.providerKey;
  if (props.providerName === 'R') return user.roles.includes(props.providerKey);

  return false;
}

async function save(): Promise<void> {
  const changed = changesBetween(original.value, working.value);
  if (changed.length === 0) {
    visible.value = false;
    return;
  }

  busy.value = true;

  try {
    await permissions.update(props.providerName, props.providerKey, { permissions: changed });
    visible.value = false;
    if (changesCurrentUser()) await configState.refreshAppState();
    toaster.success('AbpUi::SavedSuccessfully');
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

    <div v-else class="abp-permissions">
      <div class="abp-permissions__header">
        <AbpInput
          v-model="filter"
          type="search"
          :aria-label="$t('AbpPermissionManagement::Filter')"
          :placeholder="$t('AbpPermissionManagement::Filter')"
        />

        <AbpToggle
          class="abp-permissions__all"
          :model-value="allState.checked"
          :indeterminate="allState.indeterminate"
          :disabled="allDisabled"
          :label="$t('AbpPermissionManagement::SelectAllInAllTabs')"
          @update:model-value="setAll"
        />
      </div>

      <div class="abp-permissions__body">
        <div
          class="abp-permissions__groups"
          role="tablist"
          aria-orientation="vertical"
          :aria-label="$t('AbpPermissionManagement::PermissionGroup')"
        >
          <button
            v-for="group in groups"
            :key="group.name"
            type="button"
            role="tab"
            class="abp-permissions__group"
            :class="{ 'abp-permissions__group--active': group.name === selectedGroup }"
            :aria-selected="group.name === selectedGroup"
            :tabindex="group.name === selectedGroup ? 0 : -1"
            @click="selectedGroup = group.name ?? ''"
          >
            {{ group.displayName }}
            <span v-if="grantedCount(group) > 0">({{ grantedCount(group) }})</span>
          </button>
        </div>

        <div class="abp-permissions__list" role="tabpanel">
          <AbpToggle
            v-if="shown.length"
            class="abp-permissions__all"
            :model-value="groupState.checked"
            :indeterminate="groupState.indeterminate"
            :disabled="groupDisabled"
            :label="$t('AbpPermissionManagement::SelectAllInThisTab')"
            @update:model-value="setAllInGroup"
          />

          <hr />

          <div
            v-for="permission in shown"
            :key="permission.name"
            class="abp-permissions__permission"
            :style="{ marginInlineStart: `${permission.depth * INDENT_STEP}px` }"
          >
            <AbpToggle
              :model-value="permission.isGranted"
              :disabled="isGrantedElsewhere(permission, providerName)"
              :label="permission.displayName"
              @update:model-value="working = toggle(working, permission.name ?? '')"
            />
            <template v-if="!hideBadges">
              <span
                v-for="granted in permission.grantedProviders"
                :key="`${granted.providerName}:${granted.providerKey}`"
                class="abp-permissions__badge"
              >
                {{ granted.providerName }}: {{ granted.providerKey }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <AbpButton variant="secondary" outline :disabled="busy" @click="visible = false">
        {{ $t('AbpUi::Cancel') }}
      </AbpButton>
      <AbpButton variant="primary" :loading="busy" @click="save">
        {{ $t('AbpUi::Save') }}
      </AbpButton>
    </template>
  </AbpModal>
</template>
