<script setup lang="ts" generic="R">
import type { AbpFormControl } from '@lsw-abpvue/theme-shared';
import { computed } from 'vue';
import { FormPropList, groupFormProps, type FormProp } from '../models/form-props.js';
import type { PropData } from '../models/prop-data.js';
import type { ExtensibleForm } from '../utils/use-extensible-form.js';
import { useGetInjected } from '../utils/use-action-list.js';
import AbpFormControlField from './AbpFormControl.vue';

const props = defineProps<{
  /** What `useExtensibleForm()` built: the controls and the fields that made them. */
  form: ExtensibleForm<R>;
  /** The record being edited, for the callbacks that ask about it. */
  record?: R | undefined;
}>();

defineSlots<{
  [name: `field-${string}`]: (props: { prop: FormProp<R>; control: AbpFormControl }) => unknown;
}>();

const { getInjected } = useGetInjected();

const data = computed<PropData<R>>(() => ({
  record: (props.record ?? {}) as R,
  getInjected,
}));

/** Fields carrying the same group name render together; the rest stand on their own. */
const groups = computed(() => {
  const list = new FormPropList<R>();
  list.addManyTail(props.form.props);

  return groupFormProps(list);
});

const visible = (prop: FormProp<R>): boolean => prop.visible(data.value);

const controlOf = (prop: FormProp<R>): AbpFormControl | undefined => props.form.form.get(prop.name);
</script>

<template>
  <div class="abp-extensible-form">
    <component
      :is="group.group ? 'fieldset' : 'div'"
      v-for="(group, index) in groups"
      :key="group.group?.name ?? index"
      :class="[group.group?.className, 'abp-form-group']"
      :data-group="group.group?.name"
    >
      <template v-for="prop in group.props" :key="prop.name">
        <AbpFormControlField
          v-if="visible(prop) && controlOf(prop)"
          :prop="prop"
          :control="controlOf(prop) as AbpFormControl"
          :record="(record ?? {}) as R"
          :data="data"
          :class="prop.className"
        >
          <template v-if="$slots[`field-${prop.name}`]" #default="fieldProps">
            <slot :name="`field-${prop.name}`" v-bind="fieldProps" />
          </template>
        </AbpFormControlField>
      </template>
    </component>
  </div>
</template>
