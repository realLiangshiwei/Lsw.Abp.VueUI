<script setup lang="ts" generic="R">
import type { LocalizationParam } from '@lsw-abpvue/core';
import { AbpButton, AbpModal } from '@lsw-abpvue/theme-shared';
import type { RecordEditor } from '../utils/use-record-editor.js';
import AbpExtensibleForm from './AbpExtensibleForm.vue';

const props = defineProps<{
  /** What `useRecordEditor()` returned: the dialog is a view of it. */
  editor: RecordEditor<R>;
  /** Names the dialog for a screen reader; usually the page's own title. */
  label: LocalizationParam;
  /** The heading while creating a record, e.g. `AbpIdentity::NewRole`. */
  createTitle: LocalizationParam;
  /** The heading while editing one. */
  editTitle?: LocalizationParam | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  /**
   * Overrides what the save button does. A page that collects something outside the
   * form -- the roles of a user -- saves it together with the form's own body.
   */
  save?: (() => void) | undefined;
}>();

defineSlots<{
  /** The dialog's body; the extensible form unless the page says otherwise. */
  default?: () => unknown;
  header?: () => unknown;
  footer?: () => unknown;
}>();

/**
 * A page has one editor for its whole life -- it is what its `setup()` returned -- so
 * the refs are read off it once. The template then works on the refs themselves rather
 * than on a property of a prop.
 */
const { open, busy, editing, form } = props.editor;

const submit = (): void => {
  if (props.save) props.save();
  else void props.editor.save();
};

const close = (): void => {
  open.value = false;
};
</script>

<template>
  <AbpModal v-model:visible="open" :busy="busy" :size="size" :aria-label="$t(label)">
    <template #header>
      <slot name="header">
        <h2 class="h5 mb-0">
          {{ editing ? $t(editTitle ?? 'AbpUi::Edit') : $t(createTitle) }}
        </h2>
      </slot>
    </template>

    <slot>
      <AbpExtensibleForm v-if="form" :form="form" :record="editing" />
    </slot>

    <template #footer>
      <slot name="footer">
        <AbpButton variant="secondary" outline :disabled="busy" @click="close">
          {{ $t('AbpUi::Cancel') }}
        </AbpButton>
        <AbpButton variant="primary" :loading="busy" @click="submit">
          {{ $t('AbpUi::Save') }}
        </AbpButton>
      </slot>
    </template>
  </AbpModal>
</template>
