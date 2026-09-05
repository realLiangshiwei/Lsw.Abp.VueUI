<script setup lang="ts">
import {
  AbpButton,
  AbpDatePicker,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpPagination,
  AbpSelect,
  AbpSpinner,
  AbpToggle,
  AbpTypeahead,
  useAbpForm,
  useServerValidation,
  useValidationMessages,
  Validators,
  type AbpTypeaheadItem,
} from '@lsw-abpvue/theme-shared';
import { computed, ref } from 'vue';

/**
 * The twelve contract components as a page. Nothing here imports the theme: these are
 * the contracts, and whichever theme is provided is what draws them.
 */
const form = useAbpForm({
  userName: { value: '', validators: [Validators.required(), Validators.maxLength(16)] },
  email: { value: '', validators: [Validators.required(), Validators.email()] },
  role: { value: 'reader' as string },
  active: { value: true },
  joinedAt: { value: '2026-09-03' as string | null },
  owner: { value: null as string | null },
});
useServerValidation(form);

const messages = useValidationMessages();
const errorsFor = (name: keyof typeof form.controls) =>
  computed(() => (form.controls[name].touched ? messages(form.controls[name].errors) : []));

const userNameErrors = errorsFor('userName');
const emailErrors = errorsFor('email');

const roles = [
  { value: 'reader', label: 'Reader' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrator' },
];

const PEOPLE = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Barbara Liskov'];
const search = async (term: string): Promise<AbpTypeaheadItem[]> =>
  PEOPLE.filter(name => name.toLowerCase().includes(term.toLowerCase())).map(name => ({
    value: name,
    label: name,
  }));

const ownerName = ref('');
const modalOpen = ref(false);
const page = ref(0);
const pageSize = ref(10);
const saving = ref(false);

function submit(): void {
  if (!form.validate()) return;

  saving.value = true;
  setTimeout(() => (saving.value = false), 800);
}
</script>

<template>
  <h1 class="h4 mb-3">Contract components</h1>

  <form class="row g-3" novalidate @submit.prevent="submit">
    <div class="col-md-6">
      <AbpFormField v-slot="field" label="User name" required :errors="userNameErrors">
        <AbpInput
          :id="field.id"
          v-model="form.controls.userName.value"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          @blur="form.controls.userName.markAsTouched()"
        />
      </AbpFormField>
    </div>

    <div class="col-md-6">
      <AbpFormField v-slot="field" label="Email" required :errors="emailErrors">
        <AbpInput
          :id="field.id"
          v-model="form.controls.email.value"
          type="email"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          @blur="form.controls.email.markAsTouched()"
        />
      </AbpFormField>
    </div>

    <div class="col-md-4">
      <AbpFormField v-slot="field" label="Role">
        <AbpSelect :id="field.id" v-model="form.controls.role.value" :options="roles" />
      </AbpFormField>
    </div>

    <div class="col-md-4">
      <AbpFormField v-slot="field" label="Joined">
        <AbpDatePicker :id="field.id" v-model="form.controls.joinedAt.value" clearable />
      </AbpFormField>
    </div>

    <div class="col-md-4">
      <AbpFormField v-slot="field" label="Owner">
        <AbpTypeahead
          :id="field.id"
          v-model="form.controls.owner.value"
          v-model:display-value="ownerName"
          :search="search"
          :min-length="1"
        />
      </AbpFormField>
    </div>

    <div class="col-12">
      <AbpToggle v-model="form.controls.active.value" variant="switch" label="Active" />
    </div>

    <div class="col-12 d-flex align-items-center gap-2">
      <AbpButton type="submit" :loading="saving">Save</AbpButton>
      <AbpButton variant="secondary" @click="modalOpen = true">Open a dialog</AbpButton>
      <AbpSpinner v-if="saving" size="sm" label="Saving" />
    </div>
  </form>

  <hr class="my-4" />

  <AbpPagination
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="137"
    show-size-selector
    aria-label="Example pages"
  />

  <AbpModal v-model:visible="modalOpen" size="lg">
    <template #header><h2 class="h5 mb-0">A dialog</h2></template>
    <p>Focus is trapped here, Escape closes it, and focus goes back to the button.</p>
    <template #footer>
      <AbpButton variant="secondary" @click="modalOpen = false">Close</AbpButton>
    </template>
  </AbpModal>
</template>
