<template>
  <AbpFormField v-slot="{ id, describedBy, invalid }" label="Name" hint="Up to 40 characters">
    <AbpInput
      :id="id"
      v-model="name"
      :maxlength="40"
      :aria-describedby="describedBy"
      :invalid="invalid"
    />
  </AbpFormField>
  <AbpFormField v-slot="{ id }" label="Copies">
    <AbpInput :id="id" v-model="copies" type="number" :min="1" :max="100" :step="1" />
  </AbpFormField>
  <AbpFormField v-slot="{ id }" label="Password">
    <AbpInput :id="id" v-model="password" type="password" autocomplete="new-password" revealable />
  </AbpFormField>
  <AbpFormField v-slot="{ id }" label="Notes">
    <AbpInput :id="id" v-model="notes" type="textarea" :rows="3" />
  </AbpFormField>
  <output>Name: {{ name }}; copies: {{ copies ?? 'empty' }}</output>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { AbpFormField, AbpInput } from '@lsw-abpvue/theme-shared';
const name = ref('A new book');
const copies = ref<number | null>(1);
const password = ref('');
const notes = ref('');
</script>
