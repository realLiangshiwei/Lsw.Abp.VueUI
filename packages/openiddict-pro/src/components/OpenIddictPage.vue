<template>
  <AbpPage v-if="state.allowed.value" :title="title">
    <template #toolbar
      ><AbpPageToolbar :key="state.context.value" :data="state.items.value"
    /></template>
    <AbpExtensibleTable
      :key="state.context.value"
      :data="state.items.value"
      :list="state.list"
      record-key="id"
      searchable
      :caption="title"
      actions-text="AbpOpenIddict::Actions"
    />
    <p v-if="state.error.value" role="alert">
      {{ $t('AbpUi::ErrorLoadingDatatable') }}
      <AbpButton variant="secondary" @click="state.list.getWithoutPageReset()">{{
        $t('AbpUi::Refresh')
      }}</AbpButton>
    </p>
    <AbpModal
      v-model:visible="open"
      :busy="state.busy.value"
      :dirty="state.form.value?.form.dirty"
      :size="size"
      :aria-label="$t(state.editing.value ? 'AbpOpenIddict::Edit' : createTitle)"
    >
      <template #header
        ><h2 class="h5 mb-0">
          {{ $t(state.editing.value ? 'AbpOpenIddict::Edit' : createTitle) }}
        </h2></template
      >
      <AbpSpinner v-if="state.busy.value && !state.form.value" />
      <p v-if="state.loadingFailed.value" role="alert">
        {{ $t('AbpUi::ErrorLoadingDatatable') }}
        <AbpButton variant="secondary" @click="state.show(state.editing.value)">{{
          $t('AbpUi::Refresh')
        }}</AbpButton>
      </p>
      <form v-if="state.form.value" id="openiddict-form" novalidate @submit.prevent="state.save()">
        <fieldset :disabled="state.busy.value">
          <AbpExtensibleForm class="row" :form="state.form.value" :record="state.editing.value" />
        </fieldset>
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="state.busy.value" @click="close">{{
          $t('AbpOpenIddict::Cancel')
        }}</AbpButton>
        <AbpButton
          type="submit"
          form="openiddict-form"
          :loading="state.busy.value"
          :disabled="!state.form.value"
          >{{ $t('AbpOpenIddict::Save') }}</AbpButton
        >
      </template>
    </AbpModal>
    <slot />
  </AbpPage>
</template>

<script setup lang="ts" generic="R extends { id?: string | undefined }, Input">
import {
  AbpExtensibleForm,
  AbpExtensibleTable,
  AbpPage,
  AbpPageToolbar,
} from '@lsw-abpvue/components';
import { AbpButton, AbpModal, AbpSpinner } from '@lsw-abpvue/theme-shared';
import type { useOpenIddictPage } from '../utils/use-openiddict-page.js';

const props = defineProps<{
  state: ReturnType<typeof useOpenIddictPage<R, Input>>;
  title: string;
  createTitle: string;
  size?: 'md' | 'lg' | undefined;
}>();
const open = props.state.open;
</script>
