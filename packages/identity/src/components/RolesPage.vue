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
  IdentityRoleService,
  type IdentityRoleCreateDto,
  type IdentityRoleDto,
  type IdentityRoleUpdateDto,
} from '@lsw-abpvue/identity/proxy';
import { AbpPermissionManagement } from '@lsw-abpvue/permission-management';
import {
  AbpButton,
  AbpInput,
  AbpModal,
  ConfirmationStatus,
  useConfirmation,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref, shallowRef } from 'vue';
import { IdentityComponents } from '../enums/components.js';
import { ROLES_PAGE } from '../tokens/extensions.token.js';

const roles = injectAbp(IdentityRoleService);
const confirmation = useConfirmation();
const toaster = useToaster();

const list = useListService({ persistKey: 'Identity.Roles' });
const { items } = list.hookToQuery(query => roles.getList(query));

const editing = shallowRef<IdentityRoleDto>();
const form = shallowRef<ExtensibleForm<IdentityRoleDto>>();
const open = ref(false);
const busy = ref(false);
const permissionsFor = ref<IdentityRoleDto>();
const permissionsOpen = ref(false);

/**
 * The page says which component key it is, and hands the module's buttons what they run.
 * The injector this returns is also the one to build forms in later: an `inject()` after
 * this line still sees the parent's (api-parity-map §2), and the buttons run long after
 * the setup is over.
 */
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: IdentityComponents.Roles },
  {
    provide: ROLES_PAGE,
    useValue: { add: () => show(), edit: show, remove, managePermissions },
  },
]);

// Registered once, for whichever form is open: a rejected save lands on its fields.
useServerValidation({ setServerErrors: errors => form.value?.form.setServerErrors(errors) });

function show(role?: IdentityRoleDto): Promise<void> {
  editing.value = role;
  form.value = runInInjectionContext(injector, () => useExtensibleForm<IdentityRoleDto>(role));
  open.value = true;

  return Promise.resolve();
}

async function save(): Promise<void> {
  if (!form.value?.form.validate()) return;

  const body = form.value.toRequestBody();
  busy.value = true;

  try {
    // The fields came from the extension system, so their shape is only known at
    // runtime; the server is what rejects a body that is missing something.
    const current = editing.value;
    if (current?.id) {
      await roles.update(current.id, {
        ...body,
        concurrencyStamp: current.concurrencyStamp,
      } as unknown as IdentityRoleUpdateDto);
    } else {
      await roles.create(body as unknown as IdentityRoleCreateDto);
    }

    open.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
    list.get();
  } finally {
    busy.value = false;
  }
}

async function remove(role: IdentityRoleDto): Promise<void> {
  const answer = await confirmation.warn(
    'AbpIdentity::RoleDeletionConfirmationMessage',
    'AbpUi::AreYouSure',
    { messageLocalizationParams: [role.name ?? ''] },
  );
  if (answer !== ConfirmationStatus.confirm) return;

  await roles.delete(role.id ?? '');
  toaster.success('AbpUi::DeletedSuccessfully');
  list.get();
}

function managePermissions(role: IdentityRoleDto): void {
  permissionsFor.value = role;
  permissionsOpen.value = true;
}
</script>

<template>
  <AbpPage title="AbpIdentity::Roles">
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

    <AbpExtensibleTable :data="items" :list="list" record-key="id" caption="AbpIdentity::Roles" />

    <AbpModal v-model:visible="open" :busy="busy" :aria-label="$t('AbpIdentity::Roles')">
      <template #header>
        <h2 class="h5 mb-0">
          {{ editing ? $t('AbpUi::Edit') : $t('AbpIdentity::NewRole') }}
        </h2>
      </template>

      <AbpExtensibleForm v-if="form" :form="form" :record="editing" />

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
      provider-name="R"
      :provider-key="permissionsFor.name ?? ''"
      :entity-display-name="permissionsFor.name ?? ''"
    />
  </AbpPage>
</template>
