<template>
  <AbpFormField v-slot="{ id }" label="Publication date">
    <AbpDatePicker
      :id="id"
      v-model="date"
      type="date"
      min="2020-01-01"
      max="2030-12-31"
      clearable
    />
  </AbpFormField>
  <AbpFormField v-slot="{ id }" label="Collection time">
    <AbpDatePicker :id="id" v-model="time" type="time" />
  </AbpFormField>
  <AbpFormField v-slot="{ id }" label="Local appointment">
    <AbpDatePicker :id="id" v-model="appointment" type="datetime" clearable />
  </AbpFormField>
  <output
    >{{ date ?? 'No date' }} / {{ time ?? 'No time' }} /
    {{ appointment ?? 'No appointment' }}</output
  >
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpDatePicker, AbpFormField } from '@lsw-abpvue/theme-shared';
const date = ref<string | null>('2026-10-04');
const time = ref<string | null>('09:30');
const appointment = ref<string | null>(null);
</script>
