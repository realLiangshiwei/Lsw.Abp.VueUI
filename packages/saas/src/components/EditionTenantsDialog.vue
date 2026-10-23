<template>
  <AbpModal :visible="true" :busy="busy" @update:visible="$event || emit('close')">
    <template #header>{{
      $t(mode === 'delete' ? 'AbpUi::AreYouSure' : 'Saas::MoveAllTenants')
    }}</template>
    <AbpSpinner v-if="busy && !ready" />
    <p v-if="failed" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" :disabled="busy" @click="load">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <form v-if="ready && current" novalidate @submit.prevent="save">
      <p v-if="mode === 'delete'">
        {{ $t('Saas::EditionDeletionConfirmationMessage', current.displayName ?? '') }}
      </p>
      <p v-else>{{ moveMessage }}</p>
      <p v-if="mode === 'move' && !current.tenantCount" role="status">
        {{ $t('Saas::ThereIsNoTenantsCurrentlyInThisEdition') }}
      </p>
      <template v-if="current.tenantCount">
        <p>{{ $t('Saas::ChooseAnAction', String(current.tenantCount)) }}</p>
        <AbpToggle
          v-if="mode === 'delete' && canMove && editions.length"
          v-model="assign"
          :disabled="busy"
          :label="$t('Saas::AssignTenantsToOtherEdition')"
        />
        <p v-if="mode === 'delete' && !assign">
          {{ $t('Saas::UnassignTheEditionFromTheTenants') }}
        </p>
        <AbpFormField
          v-if="mode === 'move' || assign"
          :label="$t('Saas::Edition')"
          :errors="invalid ? [$t('AbpValidation::ThisFieldIsRequired.')] : []"
          :required="mode === 'delete'"
        >
          <template #default="{ id }"
            ><AbpSelect :id="id" v-model="targetId" :options="options" :disabled="busy || !canMove"
          /></template>
        </AbpFormField>
      </template>
    </form>
    <template #footer="{ close }">
      <AbpButton variant="secondary" outline :disabled="busy" @click="close">{{
        $t('AbpUi::Cancel')
      }}</AbpButton>
      <AbpButton
        :variant="mode === 'delete' ? 'danger' : 'primary'"
        :loading="busy"
        :disabled="!ready || !allowed || (mode === 'move' && !current?.tenantCount)"
        @click="save"
        >{{ $t(mode === 'delete' ? 'AbpUi::Delete' : 'AbpUi::Save') }}</AbpButton
      >
    </template>
  </AbpModal>
</template>

<script setup lang="ts">
import { inject as injectAbp, useLocalization, usePermission } from '@lsw-abpvue/core';
import { SaasPolicyNames } from '@lsw-abpvue/saas/config';
import { EditionService, type EditionDto } from '@lsw-abpvue/saas/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpModal,
  AbpSelect,
  AbpSpinner,
  AbpToggle,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { useSaasOperation } from '../utils/use-saas-operation.js';

const props = defineProps<{ edition: EditionDto; mode: 'move' | 'delete' }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const service = injectAbp(EditionService);
const permission = usePermission();
const localization = useLocalization();
const toaster = useToaster();
const operation = useSaasOperation(
  `${SaasPolicyNames.Editions} && ${props.mode === 'delete' ? SaasPolicyNames.EditionsDelete : SaasPolicyNames.TenantsUpdate}`,
);
const { busy, failed, allowed } = operation;
const ready = ref(false);
const current = shallowRef<EditionDto>();
const editions = shallowRef<EditionDto[]>([]);
const targetId = ref<string | null>(null);
const assign = ref(false);
const invalid = ref(false);
const moveMessage = computed(() =>
  localization
    .t('Saas::MoveAllTenantsWithEditionTo', current.value?.displayName ?? '')
    .replace(/<\/?b>/g, ''),
);
const canMove = computed(() =>
  permission.isGranted(`${SaasPolicyNames.Editions} && ${SaasPolicyNames.TenantsUpdate}`),
);
const options = computed(() => [
  {
    value: null,
    label: localization.t(
      props.mode === 'delete' ? 'Saas::SelectAnEditionToAssign' : 'Saas::UnassignEdition',
    ),
  },
  ...editions.value.map(edition => ({ value: edition.id ?? '', label: edition.displayName ?? '' })),
]);
let moved = false;
async function load() {
  operation.reset();
  ready.value = false;
  await operation.run(
    signal =>
      Promise.all([
        service.get(props.edition.id ?? '', { signal }),
        service.getAllList({ signal }),
      ]),
    ([record, all]) => {
      current.value = record;
      editions.value = all.filter(edition => edition.id !== record.id);
      ready.value = true;
      if (moved && record.tenantCount) moved = false;
    },
  );
}
async function save() {
  if (!ready.value || !current.value?.id) return;
  const targetValid =
    targetId.value && editions.value.some(edition => edition.id === targetId.value);
  invalid.value = props.mode === 'delete' && assign.value && !targetValid;
  if (
    invalid.value ||
    ((assign.value || props.mode === 'move') && !canMove.value) ||
    (props.mode === 'move' && !current.value.tenantCount)
  )
    return;
  const id = current.value.id;
  const success = await operation.run(
    async signal => {
      if (!moved && (props.mode === 'move' || assign.value)) {
        await service.moveAllTenants(id, targetId.value || null, { signal });
        if (signal.aborted) return;
        moved = true;
      }
      if (props.mode === 'delete') await service.delete(id, { signal });
    },
    () => {
      toaster.success(
        props.mode === 'delete' ? 'AbpUi::DeletedSuccessfully' : 'AbpUi::SavedSuccessfully',
      );
      emit('saved');
      emit('close');
    },
  );
  if (!success && failed.value) ready.value = false;
}
watch([operation.context, allowed], () => emit('close'));
onMounted(load);
</script>
