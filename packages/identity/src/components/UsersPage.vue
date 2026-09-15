<script setup lang="ts">
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  EXTENSIONS_IDENTIFIER,
  useExtensibleForm,
  type ExtensibleForm,
} from '@lsw-abpvue/components';
import {
  inject as injectAbp,
  provideAbp,
  runInInjectionContext,
  useListService,
} from '@lsw-abpvue/core';
import {
  IdentityUserService,
  type IdentityRoleDto,
  type IdentityUserCreateDto,
  type IdentityUserDto,
  type IdentityUserUpdateDto,
} from '@lsw-abpvue/identity/proxy';
import { AbpPermissionManagement } from '@lsw-abpvue/permission-management';
import {
  AbpButton,
  AbpInput,
  AbpModal,
  AbpToggle,
  ConfirmationStatus,
  useConfirmation,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref, shallowRef } from 'vue';
import { IdentityComponents } from '../enums/components.js';
import { USERS_PAGE } from '../tokens/extensions.token.js';

const users = injectAbp(IdentityUserService);
const confirmation = useConfirmation();
const toaster = useToaster();

const list = useListService({ persistKey: 'Identity.Users' });
const { items } = list.hookToQuery(query => users.getList(query));

const editing = shallowRef<IdentityUserDto>();
const form = shallowRef<ExtensibleForm<IdentityUserDto>>();
const open = ref(false);
const busy = ref(false);
const tab = ref<'details' | 'roles'>('details');

/** The roles this user may be given, and which of them they have. */
const assignable = shallowRef<IdentityRoleDto[]>([]);
const assigned = ref<string[]>([]);

const permissionsFor = shallowRef<IdentityUserDto>();
const permissionsOpen = ref(false);

/**
 * The page says which component key it is, and hands the module's buttons what they run.
 * The injector this returns is also the one to build forms in later: an `inject()` after
 * this line still sees the parent's (api-parity-map §2), and the buttons run long after
 * the setup is over.
 */
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: IdentityComponents.Users },
  {
    provide: USERS_PAGE,
    useValue: { add, edit, remove, managePermissions },
  },
]);

// Registered once, for whichever form is open: a rejected save lands on its fields.
useServerValidation({ setServerErrors: errors => form.value?.form.setServerErrors(errors) });

function show(user?: IdentityUserDto): void {
  editing.value = user;
  form.value = runInInjectionContext(injector, () => useExtensibleForm<IdentityUserDto>(user));
  tab.value = 'details';
  open.value = true;
}

async function add(): Promise<void> {
  const { items: roles } = await users.getAssignableRoles();
  assignable.value = roles;
  // A new account starts with whatever the tenant hands out by default.
  assigned.value = roles.filter(role => role.isDefault).map(role => role.name ?? '');
  show();
}

async function edit(user: IdentityUserDto): Promise<void> {
  const id = user.id ?? '';
  const [full, roles, own] = await Promise.all([
    users.get(id),
    users.getAssignableRoles(),
    users.getRoles(id),
  ]);

  assignable.value = roles.items;
  assigned.value = own.items.map(role => role.name ?? '');
  show(full);
}

async function save(): Promise<void> {
  if (!form.value?.form.validate()) {
    tab.value = 'details';
    return;
  }

  const body = { ...form.value.toRequestBody(), roleNames: [...assigned.value] };
  busy.value = true;

  try {
    // The fields came from the extension system, so their shape is only known at
    // runtime; the server is what rejects a body that is missing something.
    const current = editing.value;
    if (current?.id) {
      await users.update(current.id, {
        ...body,
        concurrencyStamp: current.concurrencyStamp,
      } as unknown as IdentityUserUpdateDto);
    } else {
      await users.create(body as unknown as IdentityUserCreateDto);
    }

    open.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
    list.get();
  } finally {
    busy.value = false;
  }
}

async function remove(user: IdentityUserDto): Promise<void> {
  const answer = await confirmation.warn(
    'AbpIdentity::UserDeletionConfirmationMessage',
    'AbpUi::AreYouSure',
    { messageLocalizationParams: [user.userName ?? ''] },
  );
  if (answer !== ConfirmationStatus.confirm) return;

  await users.delete(user.id ?? '');
  toaster.success('AbpUi::DeletedSuccessfully');
  list.get();
}

function managePermissions(user: IdentityUserDto): void {
  permissionsFor.value = user;
  permissionsOpen.value = true;
}

function toggleRole(name: string, granted: boolean): void {
  assigned.value = granted
    ? [...new Set([...assigned.value, name])]
    : assigned.value.filter(role => role !== name);
}
</script>

<template>
  <AbpPage title="AbpIdentity::Users">
    <template #toolbar>
      <AbpPageToolbar :data="items" />
    </template>

    <AbpInput
      v-model="list.filter.value"
      type="search"
      class="mb-3"
      :placeholder="$t('AbpUi::PagerSearch')"
      :aria-label="$t('AbpUi::PagerSearch')"
    />

    <AbpExtensibleTable :data="items" :list="list" record-key="id" caption="AbpIdentity::Users" />

    <AbpModal v-model:visible="open" :busy="busy" :aria-label="$t('AbpIdentity::Users')">
      <template #header>
        <h2 class="h5 mb-0">
          {{ editing ? $t('AbpUi::Edit') : $t('AbpIdentity::NewUser') }}
        </h2>
      </template>

      <div class="abp-identity-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'details'"
          :class="{ 'abp-identity-tabs__tab--active': tab === 'details' }"
          class="abp-identity-tabs__tab"
          @click="tab = 'details'"
        >
          {{ $t('AbpIdentity::UserInformations') }}
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'roles'"
          :class="{ 'abp-identity-tabs__tab--active': tab === 'roles' }"
          class="abp-identity-tabs__tab"
          @click="tab = 'roles'"
        >
          {{ $t('AbpIdentity::Roles') }}
        </button>
      </div>

      <div role="tabpanel" class="abp-identity-tabs__panel">
        <AbpExtensibleForm v-if="form" v-show="tab === 'details'" :form="form" :record="editing" />

        <div v-if="tab === 'roles'" class="abp-identity-roles">
          <AbpToggle
            v-for="role in assignable"
            :key="role.id ?? role.name ?? ''"
            :model-value="assigned.includes(role.name ?? '')"
            :label="role.name"
            @update:model-value="toggleRole(role.name ?? '', $event === true)"
          />
        </div>
      </div>

      <template #footer>
        <AbpButton variant="secondary" outline :disabled="busy" @click="open = false">
          {{ $t('AbpUi::Cancel') }}
        </AbpButton>
        <AbpButton variant="primary" :loading="busy" @click="save">
          {{ $t('AbpUi::Save') }}
        </AbpButton>
      </template>
    </AbpModal>

    <AbpPermissionManagement
      v-if="permissionsFor"
      v-model:visible="permissionsOpen"
      provider-name="U"
      :provider-key="permissionsFor.id ?? ''"
      :entity-display-name="permissionsFor.userName ?? ''"
    />
  </AbpPage>
</template>
