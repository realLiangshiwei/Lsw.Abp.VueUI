<template>
  <AbpSpinner v-if="busy && !ready" />
  <p v-if="failed" role="alert">
    {{ $t('AbpUi::ErrorLoadingDatatable') }}
    <AbpButton variant="secondary" :disabled="busy" @click="load">{{
      $t('AbpUi::Refresh')
    }}</AbpButton>
  </p>
  <fieldset v-if="ready" :disabled="busy || disabled || !allowed">
    <AbpToggle v-model="shared" :label="$t('Saas::DisplayName:UseSharedDatabase')" class="mb-3" />
    <template v-if="!shared">
      <AbpFormField
        :label="$t('Saas::DisplayName:Default')"
        :errors="errors"
        :required="!model.databases?.length"
      >
        <template #default="{ id, invalid, describedBy }">
          <div class="d-flex flex-wrap gap-2">
            <AbpInput
              :id="id"
              v-model="defaultString"
              type="password"
              revealable
              autocomplete="off"
              :invalid="invalid"
              :aria-describedby="describedBy"
            />
            <AbpButton
              variant="secondary"
              :disabled="!defaultString"
              @click="check(defaultString)"
              >{{ $t('Saas::CheckConnectionString') }}</AbpButton
            >
          </div>
        </template>
      </AbpFormField>
      <AbpToggle
        v-if="databaseNames.length"
        v-model="specific"
        :label="$t('Saas::DisplayName:UseSpecificDatabase')"
        class="my-3"
      />
      <template v-if="specific">
        <AbpFormField :label="$t('Saas::DisplayName:DatabaseName')">
          <template #default="{ id }"
            ><AbpSelect :id="id" v-model="databaseName" :options="databaseOptions"
          /></template>
        </AbpFormField>
        <AbpFormField :label="$t('Saas::DisplayName:ConnectionString')">
          <template #default="{ id }"
            ><AbpInput
              :id="id"
              v-model="connectionString"
              type="password"
              revealable
              autocomplete="off"
              @keydown.enter.prevent="add"
          /></template>
        </AbpFormField>
        <div class="d-flex flex-wrap gap-2 my-3">
          <AbpButton :disabled="!databaseName || !connectionString.trim()" @click="add">{{
            $t('Saas::AddDatabaseConnectionString')
          }}</AbpButton>
          <AbpButton
            variant="secondary"
            :disabled="!connectionString.trim()"
            @click="check(connectionString)"
            >{{ $t('Saas::CheckConnectionString') }}</AbpButton
          >
        </div>
        <ul class="list-group">
          <li
            v-for="database in model.databases"
            :key="database.databaseName"
            class="list-group-item d-flex align-items-center gap-2 flex-wrap"
          >
            <span>{{ database.databaseName }}</span>
            <span aria-hidden="true">••••••••</span>
            <AbpButton
              variant="danger"
              outline
              :aria-label="`${$t('AbpUi::Delete')} ${database.databaseName}`"
              @click="remove(database.databaseName ?? '')"
              >{{ $t('AbpUi::Delete') }}</AbpButton
            >
          </li>
        </ul>
      </template>
    </template>
  </fieldset>
</template>

<script setup lang="ts">
import { inject as injectAbp, useLocalization } from '@lsw-abpvue/core';
import { SaasPolicyNames } from '@lsw-abpvue/saas/config';
import { TenantService, type SaasTenantConnectionStringsDto } from '@lsw-abpvue/saas/proxy';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpSelect,
  AbpSpinner,
  AbpToggle,
  useConfirmation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { computed, ref, watch } from 'vue';
import { useSaasOperation } from '../utils/use-saas-operation.js';

const props = defineProps<{ tenantId?: string | undefined; disabled?: boolean | undefined }>();
const model = defineModel<SaasTenantConnectionStringsDto>({ required: true });
const tenants = injectAbp(TenantService);
const toaster = useToaster();
const localization = useLocalization();
const confirmation = useConfirmation();
const operation = useSaasOperation(
  props.tenantId ? SaasPolicyNames.TenantsManageConnectionStrings : SaasPolicyNames.TenantsCreate,
);
const { busy, failed, allowed } = operation;
const ready = ref(false);
const shared = ref(true);
const specific = ref(false);
const submitted = ref(false);
const databaseNames = ref<string[]>([]);
const databaseName = ref<string | null>(null);
const connectionString = ref('');
const defaultString = computed({
  get: () => model.value.default ?? '',
  set: value => {
    model.value = { ...model.value, default: value };
  },
});
const databaseOptions = computed(() => [
  { value: null, label: '-' },
  ...databaseNames.value
    .filter(name => !model.value.databases?.some(item => item.databaseName === name))
    .map(name => ({ value: name, label: name })),
]);
const valid = computed(
  () =>
    shared.value ||
    !!defaultString.value.trim() ||
    !!model.value.databases?.some(item => item.connectionString?.trim()),
);
const errors = computed(() =>
  submitted.value && !valid.value ? [localization.t('AbpValidation::ThisFieldIsRequired.')] : [],
);

async function load() {
  operation.reset();
  ready.value = false;
  await operation.run(
    async signal =>
      Promise.all([
        tenants.getDatabases({ signal }),
        props.tenantId
          ? tenants.getConnectionStrings(props.tenantId, { signal })
          : Promise.resolve(model.value),
      ]),
    ([catalog, current]) => {
      const databases = (current.databases ?? [])
        .filter(item => item.connectionString)
        .map(item => ({ ...item, extraProperties: { ...item.extraProperties } }));
      model.value = { ...current, databases };
      databaseNames.value = [
        ...new Set([
          ...(catalog.databases ?? []),
          ...databases.map(item => item.databaseName ?? '').filter(Boolean),
        ]),
      ];
      shared.value = !current.default && !databases.length;
      specific.value = !!databases.length;
      ready.value = true;
    },
  );
}
watch(shared, value => {
  if (value && ready.value) {
    model.value = { ...model.value, default: '', databases: [] };
    specific.value = false;
  }
});
watch(specific, value => {
  if (!value && ready.value) model.value = { ...model.value, databases: [] };
});
watch([operation.context, allowed], () => {
  ready.value = false;
  model.value = { default: '', databases: [] };
});
watch(() => props.tenantId, load, { immediate: true });

async function check(value: string) {
  if (!ready.value || props.disabled || !value.trim()) return;
  await operation.run(
    signal => tenants.checkConnectionString(value, { signal }),
    valid => {
      if (valid) toaster.success('Saas::ValidConnectionString');
      else toaster.error('Saas::InvalidConnectionString');
    },
  );
}
function add() {
  if (
    !ready.value ||
    busy.value ||
    props.disabled ||
    !allowed.value ||
    !connectionString.value.trim() ||
    !databaseOptions.value.some(option => option.value === databaseName.value) ||
    !databaseName.value
  )
    return;
  model.value = {
    ...model.value,
    databases: [
      ...(model.value.databases ?? []),
      {
        databaseName: databaseName.value,
        connectionString: connectionString.value,
        extraProperties: {},
      },
    ],
  };
  databaseName.value = null;
  connectionString.value = '';
}
async function remove(name: string) {
  if (busy.value || props.disabled || !allowed.value) return;
  const context = operation.context.value;
  const answer = await confirmation.warn('AbpUi::AreYouSure', 'AbpUi::AreYouSure');
  if (answer === 'confirm' && context === operation.context.value && allowed.value)
    model.value = {
      ...model.value,
      databases: model.value.databases?.filter(item => item.databaseName !== name) ?? [],
    };
}
function validate() {
  submitted.value = true;
  return ready.value && !busy.value && allowed.value && valid.value;
}
defineExpose({ validate });
</script>
