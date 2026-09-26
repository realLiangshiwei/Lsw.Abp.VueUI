<script setup lang="ts">
import {
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  useRecordEditor,
} from '@lsw-abpvue/components';
import { inject as injectAbp, useListService } from '@lsw-abpvue/core';
import {
  IdentityRoleService,
  type IdentityRoleCreateDto,
  type IdentityRoleDto,
  type IdentityRoleUpdateDto,
} from '@lsw-abpvue/identity/proxy';
import { AbpPermissionManagement } from '@lsw-abpvue/permission-management';
import { ref, shallowRef } from 'vue';
import { IdentityComponents } from '../enums/components.js';
import { ROLES_PAGE } from '../tokens/extensions.token.js';

const roles = injectAbp(IdentityRoleService);

const list = useListService({ persistKey: 'Identity.Roles' });
const { items } = list.hookToQuery(query => roles.getList(query));

const permissionsFor = shallowRef<IdentityRoleDto>();
const permissionsOpen = ref(false);

function managePermissions(role: IdentityRoleDto): void {
  permissionsFor.value = role;
  permissionsOpen.value = true;
}

const editor = useRecordEditor<IdentityRoleDto>({
  identifier: IdentityComponents.Roles,
  reload: () => list.get(),
  // The extension system decides the fields, so the body's shape is only known at runtime.
  create: body => roles.create(body as unknown as IdentityRoleCreateDto),
  update: (id, body) => roles.update(id, body as unknown as IdentityRoleUpdateDto),
  delete: id => roles.delete(id),
  idOf: role => role.id,
  stampOf: role => role.concurrencyStamp,
  nameOf: role => role.name ?? '',
  deletionMessage: 'AbpIdentity::RoleDeletionConfirmationMessage',
  providers: [
    {
      provide: ROLES_PAGE,
      useValue: {
        add: () => editor.show(),
        edit: (role: IdentityRoleDto) => Promise.resolve(editor.show(role)),
        remove: (role: IdentityRoleDto) => editor.remove(role),
        managePermissions,
      },
    },
  ],
});
</script>

<template>
  <AbpPage title="AbpIdentity::Roles">
    <template #toolbar>
      <AbpPageToolbar :data="items" />
    </template>

    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="AbpIdentity::Roles"
      searchable
    />

    <AbpRecordModal
      :editor="editor"
      label="AbpIdentity::Roles"
      create-title="AbpIdentity::NewRole"
    />

    <AbpPermissionManagement
      v-if="permissionsFor"
      v-model:visible="permissionsOpen"
      provider-name="R"
      :provider-key="permissionsFor.name ?? ''"
      :entity-display-name="permissionsFor.name ?? ''"
    />
  </AbpPage>
</template>
