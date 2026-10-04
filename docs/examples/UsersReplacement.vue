<template>
  <AbpPage title="AbpIdentity::Users">
    <template #toolbar><AbpPageToolbar :data="items" /></template>
    <p class="alert alert-info">This directory uses the module's contributed columns and fields.</p>
    <p v-if="preparing" role="status">Preparing the selected user…</p>
    <AbpExtensibleTable :data="items" :list="list" record-key="id" searchable />
    <AbpRecordModal
      :editor="editor"
      label="AbpIdentity::Users"
      create-title="AbpIdentity::NewUser"
      :save="save"
    >
      <AbpExtensibleForm
        v-if="editor.form.value"
        :form="editor.form.value"
        :record="editor.editing.value"
      />
      <fieldset :disabled="editor.busy.value">
        <legend class="h6">Roles</legend>
        <AbpToggle
          v-for="role in roles"
          :key="role.id ?? role.name ?? ''"
          :label="role.name"
          :model-value="chosenRoles.includes(role.name ?? '')"
          @update:model-value="toggleRole(role.name ?? '', $event === true)"
        />
      </fieldset>
    </AbpRecordModal>
    <AbpPermissionManagement
      v-if="permissionUser"
      v-model:visible="permissionsVisible"
      provider-name="U"
      :provider-key="permissionUser.id ?? ''"
      :entity-display-name="permissionUser.userName ?? ''"
    />
  </AbpPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue';
import { inject, useListService } from '@lsw-abpvue/core';
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
  AbpRecordModal,
  useRecordEditor,
} from '@lsw-abpvue/components';
import { IdentityComponents, USERS_PAGE } from '@lsw-abpvue/identity';
import {
  IdentityUserService,
  type IdentityRoleDto,
  type IdentityUserCreateDto,
  type IdentityUserDto,
  type IdentityUserUpdateDto,
} from '@lsw-abpvue/identity/proxy';
import { AbpPermissionManagement } from '@lsw-abpvue/permission-management';
import { AbpToggle } from '@lsw-abpvue/theme-shared';

const users = inject(IdentityUserService);
const list = useListService({ persistKey: IdentityComponents.Users });
const { items } = list.hookToQuery((query, signal) => users.getList(query, { signal }));
const preparing = ref(false);
const roles = shallowRef<IdentityRoleDto[]>([]);
const chosenRoles = ref<string[]>([]);
const permissionUser = shallowRef<IdentityUserDto>();
const permissionsVisible = ref(false);
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
const editor = useRecordEditor<IdentityUserDto>({
  identifier: IdentityComponents.Users,
  reload: () => list.get(),
  create: body =>
    users.create(body as unknown as IdentityUserCreateDto, { signal: controller.signal }),
  update: (id, body) =>
    users.update(id, body as unknown as IdentityUserUpdateDto, { signal: controller.signal }),
  delete: id => users.delete(id, { signal: controller.signal }),
  idOf: record => record.id,
  nameOf: record => record.userName ?? '',
  stampOf: record => record.concurrencyStamp,
  deletionMessage: 'AbpIdentity::UserDeletionConfirmationMessage',
  providers: [
    {
      provide: USERS_PAGE,
      useValue: {
        add: () => void prepare(),
        edit: (record: IdentityUserDto) => prepare(record),
        remove,
        managePermissions,
      },
    },
  ],
});
async function prepare(record?: IdentityUserDto): Promise<void> {
  if (preparing.value || editor.busy.value) return;
  preparing.value = true;
  try {
    const available = await users.getAssignableRoles({ signal: controller.signal });
    roles.value = available.items;
    if (record?.id) {
      const [detail, assigned] = await Promise.all([
        users.get(record.id, { signal: controller.signal }),
        users.getRoles(record.id, { signal: controller.signal }),
      ]);
      chosenRoles.value = assigned.items.map(role => role.name ?? '');
      editor.show(detail);
    } else {
      chosenRoles.value = available.items
        .filter(role => role.isDefault)
        .map(role => role.name ?? '');
      editor.show();
    }
  } catch {
    /* Keep the directory usable; framework handlers report the failure. */
  } finally {
    preparing.value = false;
  }
}
async function remove(record: IdentityUserDto): Promise<void> {
  if (preparing.value || editor.busy.value) return;
  preparing.value = true;
  try {
    await editor.remove(record);
  } finally {
    preparing.value = false;
  }
}
function managePermissions(record: IdentityUserDto): void {
  permissionUser.value = record;
  permissionsVisible.value = true;
}
function toggleRole(name: string, checked: boolean): void {
  chosenRoles.value = checked
    ? [...new Set([...chosenRoles.value, name])]
    : chosenRoles.value.filter(value => value !== name);
}
function save(): void {
  if (!editor.busy.value) void editor.save({ roleNames: [...chosenRoles.value] });
}
</script>
