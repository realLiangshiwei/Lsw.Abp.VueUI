<script setup lang="ts">
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  AbpTabList,
  useRecordEditor,
} from '@lsw-abpvue/components';
import { inject as injectAbp, useListService } from '@lsw-abpvue/core';
import {
  IdentityUserService,
  type IdentityRoleDto,
  type IdentityUserCreateDto,
  type IdentityUserDto,
  type IdentityUserUpdateDto,
} from '@lsw-abpvue/identity/proxy';
import { AbpPermissionManagement } from '@lsw-abpvue/permission-management';
import { AbpToggle } from '@lsw-abpvue/theme-shared';
import { ref, shallowRef } from 'vue';
import { IdentityComponents } from '../enums/components.js';
import { USERS_PAGE } from '../tokens/extensions.token.js';

const users = injectAbp(IdentityUserService);

const list = useListService({ persistKey: IdentityComponents.Users });
const { items } = list.hookToQuery(query => users.getList(query));

const tab = ref('details');

const DIALOG_TABS = [
  { name: 'details', text: 'AbpIdentity::UserInformations' },
  { name: 'roles', text: 'AbpIdentity::Roles' },
] as const;

/** The roles this user may be given, and which of them they have. */
const assignable = shallowRef<IdentityRoleDto[]>([]);
const assigned = ref<string[]>([]);

const permissionsFor = shallowRef<IdentityUserDto>();
const permissionsOpen = ref(false);

function managePermissions(user: IdentityUserDto): void {
  permissionsFor.value = user;
  permissionsOpen.value = true;
}

const editor = useRecordEditor<IdentityUserDto>({
  identifier: IdentityComponents.Users,
  reload: () => list.get(),
  // The extension system decides the fields, so the body's shape is only known at runtime.
  create: body => users.create(body as unknown as IdentityUserCreateDto),
  update: (id, body) => users.update(id, body as unknown as IdentityUserUpdateDto),
  delete: id => users.delete(id),
  idOf: user => user.id,
  stampOf: user => user.concurrencyStamp,
  nameOf: user => user.userName ?? '',
  deletionMessage: 'AbpIdentity::UserDeletionConfirmationMessage',
  providers: [
    {
      provide: USERS_PAGE,
      useValue: {
        add,
        edit,
        remove: (user: IdentityUserDto) => editor.remove(user),
        managePermissions,
      },
    },
  ],
});

function show(user?: IdentityUserDto): void {
  tab.value = 'details';
  editor.show(user);
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
  // Asked here as well as inside the editor, because a field that failed may be on the
  // tab you cannot see.
  if (!editor.form.value?.form.validate()) {
    tab.value = 'details';
    return;
  }

  await editor.save({ roleNames: [...assigned.value] });
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

    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpIdentity::Users"
      searchable
    />

    <AbpRecordModal
      :editor="editor"
      label="AbpIdentity::Users"
      create-title="AbpIdentity::NewUser"
      :save="save"
    >
      <AbpTabList
        v-model="tab"
        orientation="horizontal"
        :items="DIALOG_TABS"
        :aria-label="$t('AbpIdentity::Users')"
      />

      <div role="tabpanel" class="abp-tabs__panel">
        <AbpExtensibleForm
          v-if="editor.form.value"
          v-show="tab === 'details'"
          :form="editor.form.value"
          :record="editor.editing.value"
        />

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
    </AbpRecordModal>

    <AbpPermissionManagement
      v-if="permissionsFor"
      v-model:visible="permissionsOpen"
      provider-name="U"
      :provider-key="permissionsFor.id ?? ''"
      :entity-display-name="permissionsFor.userName ?? ''"
    />
  </AbpPage>
</template>
