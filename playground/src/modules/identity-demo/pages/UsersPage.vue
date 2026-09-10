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
  AbpButton,
  AbpModal,
  ConfirmationStatus,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref, shallowRef } from 'vue';
import { IdentityComponents } from '../enums.js';
import { DemoUsersService, type DemoUserDto } from '../services/users.service.js';
import { USERS_PAGE } from '../tokens/extensions.token.js';

const users = injectAbp(DemoUsersService);
const confirmation = useConfirmation();
const toaster = useToaster();

const list = useListService({ persistKey: 'Identity.Users' });
const { items } = list.hookToQuery(query => users.getList(query));

const editing = shallowRef<DemoUserDto | undefined>();
const form = shallowRef<ExtensibleForm<DemoUserDto>>();
const open = ref(false);

/**
 * The page says which component key it is, and hands the module's buttons what they run.
 * The injector this returns is also the one to build forms in later: an `inject()` after
 * this line still sees the parent's (api-parity-map §2), and the buttons run long after
 * the setup is over.
 */
const injector = provideAbp([
  { provide: EXTENSIONS_IDENTIFIER, useValue: IdentityComponents.Users },
  { provide: USERS_PAGE, useValue: { add: () => show(), edit: show, remove } },
]);

function show(user?: DemoUserDto): void {
  editing.value = user;
  form.value = runInInjectionContext(injector, () => useExtensibleForm<DemoUserDto>(user));
  open.value = true;
}

async function save(): Promise<void> {
  if (!form.value?.form.validate()) return;

  const body = form.value.toRequestBody();
  await users.save(editing.value ? { ...body, id: editing.value.id } : body);
  open.value = false;
  toaster.success('AbpUi::SavedSuccessfully');
  list.get();
}

async function remove(user: DemoUserDto): Promise<void> {
  const answer = await confirmation.warn('AbpIdentity::UserDeletionConfirmationMessage', {
    key: 'AbpUi::AreYouSure',
    defaultValue: 'Are you sure?',
  });
  if (answer !== ConfirmationStatus.confirm) return;

  await users.delete(user.id);
  toaster.success('AbpUi::DeletedSuccessfully');
  list.get();
}
</script>

<template>
  <AbpPage title="AbpIdentity::Users">
    <template #toolbar>
      <AbpPageToolbar :data="items" />
    </template>

    <AbpExtensibleTable :data="items" :list="list" record-key="id" caption="AbpIdentity::Users" />

    <AbpModal v-model:visible="open" :aria-label="$t('AbpIdentity::Users')">
      <template #header>
        <h2 class="h5 mb-0">
          {{ editing ? $t('AbpIdentity::Edit') : $t('AbpIdentity::NewUser') }}
        </h2>
      </template>

      <AbpExtensibleForm v-if="form" :form="form" :record="editing" />

      <template #footer>
        <AbpButton variant="secondary" outline @click="open = false">
          {{ $t('AbpUi::Cancel') }}
        </AbpButton>
        <AbpButton variant="primary" @click="save">{{ $t('AbpUi::Save') }}</AbpButton>
      </template>
    </AbpModal>
  </AbpPage>
</template>
