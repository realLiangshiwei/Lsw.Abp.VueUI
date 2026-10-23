<template>
  <AbpModal
    v-model:visible="open"
    :aria-label="$t(title)"
    :busy="state.editor.busy.value && !state.loading.value"
    :dirty="dirty || state.editor.form.value?.form.dirty"
    size="lg"
  >
    <template #header>{{ $t(state.target.value ? 'AbpUi::Edit' : createTitle) }}</template>
    <AbpSpinner v-if="state.loading.value" />
    <p v-else-if="state.failed.value" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="state.show(state.target.value)">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <form v-else-if="state.editor.form.value" novalidate @submit.prevent="state.save">
      <fieldset :disabled="state.editor.busy.value || !state.canSave.value">
        <slot :form="state.editor.form.value" :record="state.editor.editing.value">
          <AbpExtensibleForm :form="state.editor.form.value" :record="state.editor.editing.value" />
        </slot>
      </fieldset>
    </form>
    <template #footer="{ close }">
      <AbpButton
        variant="secondary"
        outline
        :disabled="state.editor.busy.value && !state.loading.value"
        @click="close"
        >{{ $t('AbpUi::Cancel') }}</AbpButton
      >
      <AbpButton
        :loading="state.editor.busy.value"
        :disabled="!state.canSave.value"
        @click="state.save"
        >{{ $t('AbpUi::Save') }}</AbpButton
      >
    </template>
  </AbpModal>
</template>

<script
  setup
  lang="ts"
  generic="
    R extends {
      id?: string | undefined;
      concurrencyStamp?: string | undefined;
      extraProperties?: Record<string, unknown> | undefined;
    }
  "
>
import { AbpExtensibleForm } from '@lsw-abpvue/components';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import type { useSaasEditor } from '../utils/use-saas-editor.js';

const props = defineProps<{
  state: ReturnType<typeof useSaasEditor<R>>;
  title: string;
  createTitle: string;
  dirty?: boolean | undefined;
}>();
const { open } = props.state.editor;
</script>
