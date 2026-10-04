<template>
  <form @submit.prevent="save">
    <AbpFormField v-slot="{ id }" label="Name" :errors="errors('name')" required>
      <AbpInput :id="id" v-model="form.controls.name.value" :disabled="saving" />
    </AbpFormField>
    <AbpFormField v-slot="{ id }" label="Type" :errors="errors('type')" required>
      <AbpSelect :id="id" v-model="form.controls.type.value" :options="types" :disabled="saving" />
    </AbpFormField>
    <AbpFormField v-slot="{ id }" label="Publication date" :errors="errors('publishDate')" required>
      <AbpDatePicker :id="id" v-model="form.controls.publishDate.value" :disabled="saving" />
    </AbpFormField>
    <AbpFormField v-slot="{ id }" label="Price" :errors="errors('price')" required>
      <AbpInput :id="id" v-model="form.controls.price.value" type="number" :disabled="saving" />
    </AbpFormField>
    <p v-for="message in form.unmatchedServerErrors" :key="message" role="alert">{{ message }}</p>
    <AbpButton type="submit" :loading="saving">Save</AbpButton>
    <output v-if="createdId">Created book: {{ createdId }}</output>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { inject, useLocalization } from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpSelect,
  useAbpForm,
  useServerValidation,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';
import {
  BookService,
  BookType,
  bookTypeOptions,
  createUpdateBookDtoValidators,
  type CreateUpdateBookDto,
} from './generated/books';

const books = inject(BookService);
const localization = useLocalization();
const messages = useValidationMessages();
const form = useAbpForm({
  name: { value: '', validators: [...createUpdateBookDtoValidators.name] },
  type: {
    value: BookType.Adventure as number | null,
    validators: [...createUpdateBookDtoValidators.type],
  },
  publishDate: {
    value: null as string | null,
    validators: [...createUpdateBookDtoValidators.publishDate],
  },
  price: {
    value: 0 as number | null,
    validators: [...createUpdateBookDtoValidators.price, Validators.max(500)],
  },
});
useServerValidation(form);
const types = computed(() =>
  bookTypeOptions.map(option => ({
    value: option.value,
    label: localization.t({
      key: `BookStore::Enum:BookType.${option.value}`,
      defaultValue: option.key,
    }),
  })),
);
const errors = (key: keyof typeof form.controls) =>
  form.controls[key].touched ? messages(form.controls[key].errors) : [];
const saving = ref(false);
const createdId = ref<string>();
const request = new AbortController();
onBeforeUnmount(() => request.abort());
async function save(): Promise<void> {
  if (saving.value || !form.validate()) return;
  const { name, type, publishDate, price } = form.value;
  if (type === null || publishDate === null || price === null) return;
  const input: CreateUpdateBookDto = { name, type, publishDate, price, extraProperties: {} };
  saving.value = true;
  try {
    const created = await books.create(input, { signal: request.signal });
    if (request.signal.aborted) return;
    createdId.value = created.id;
    form.reset();
  } catch {
    /* Keep the input and server validation messages. */
  } finally {
    saving.value = false;
  }
}
</script>
