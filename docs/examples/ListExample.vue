<template>
  <AbpPage title="BookStore::Books">
    <form class="row g-3 mb-3" @submit.prevent="list.get()">
      <AbpFormField v-slot="{ id }" class="col-md-5" label="Search">
        <AbpInput :id="id" v-model="list.filter.value" placeholder="Book name" />
      </AbpFormField>
      <AbpFormField v-slot="{ id }" class="col-md-3" label="Category">
        <AbpSelect
          :id="id"
          v-model="category"
          :options="categories"
          placeholder="All categories"
          clearable
        />
      </AbpFormField>
      <AbpFormField v-slot="{ id }" class="col-md-2" label="Minimum price">
        <AbpInput :id="id" v-model="minPrice" type="number" :min="0" :max="1000" />
      </AbpFormField>
      <div class="col-md-2 d-flex align-items-end">
        <AbpButton variant="secondary" @click="resetFilters">Reset filters</AbpButton>
      </div>
    </form>
    <div class="d-flex flex-wrap gap-2 mb-3">
      <AbpButton @click="createBook">New book</AbpButton>
      <AbpButton variant="secondary" :disabled="loading" @click="list.getWithoutPageReset()"
        >Refresh current page</AbpButton
      >
      <span role="status">Selected: {{ selected.length }}</span>
    </div>
    <p v-if="error" role="alert">
      The query failed. Previous rows are kept until a successful retry.
      <AbpButton
        size="sm"
        variant="secondary"
        :disabled="loading"
        @click="list.getWithoutPageReset()"
        >Retry</AbpButton
      >
    </p>
    <AbpDataTable
      v-model:sort-key="list.sortKey.value"
      v-model:sort-order="list.sortOrder.value"
      v-model:selected="selected"
      :columns="columns"
      :data="items"
      record-key="id"
      selectable
      :loading="loading"
      caption="Filtered book catalogue"
    >
      <template #cell-price="{ value }">{{ Number(value).toFixed(2) }}</template>
      <template #cell-actions="{ row }">
        <AbpGridActions :record="row" :actions="rowActions" :disabled="saving || deleting" />
      </template>
      <template #empty>No books match these filters. Create one or reset the filters.</template>
    </AbpDataTable>
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
      <span>{{ localization.t('AbpUi::PagerInfo{0}{1}{2}', first, last, totalCount) }}</span>
      <AbpPagination
        v-model:page="list.page.value"
        v-model:page-size="list.maxResultCount.value"
        :total="totalCount"
        show-size-selector
      />
    </div>
    <AbpModal v-model:visible="visible" title="Book" :dirty="form.dirty" :busy="saving">
      <form id="book-editor" @submit.prevent="save">
        <AbpFormField v-slot="{ id }" label="Name" :errors="fieldErrors('name')" required>
          <AbpInput :id="id" v-model="form.controls.name.value" :disabled="saving" />
        </AbpFormField>
        <AbpFormField v-slot="{ id }" label="Category" :errors="fieldErrors('category')" required>
          <AbpSelect
            :id="id"
            v-model="form.controls.category.value"
            :options="categories"
            :disabled="saving"
          />
        </AbpFormField>
        <AbpFormField v-slot="{ id }" label="Price" :errors="fieldErrors('price')" required>
          <AbpInput
            :id="id"
            v-model="form.controls.price.value"
            type="number"
            :min="0"
            :max="1000"
            :disabled="saving"
          />
        </AbpFormField>
        <p v-for="message in form.unmatchedServerErrors" :key="message" role="alert">
          {{ message }}
        </p>
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" :disabled="saving" @click="close">Cancel</AbpButton>
        <AbpButton type="submit" form="book-editor" :loading="saving">Save</AbpButton>
      </template>
    </AbpModal>
  </AbpPage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  AbpDataTable,
  AbpGridActions,
  AbpPage,
  type AbpTableColumn,
  type RowAction,
} from '@lsw-abpvue/components';
import {
  inject,
  RestService,
  useListService,
  useLocalization,
  type PagedResultDto,
} from '@lsw-abpvue/core';
import {
  AbpButton,
  AbpFormField,
  AbpInput,
  AbpModal,
  AbpPagination,
  AbpSelect,
  ConfirmationStatus,
  useAbpForm,
  useConfirmation,
  useServerValidation,
  useValidationMessages,
  Validators,
} from '@lsw-abpvue/theme-shared';

interface Book {
  id: string;
  name: string;
  category: string;
  price: number;
}
type BookInput = { name: string; category: string; price: number | null };
const endpoint = '/api/app/documentation-catalog';
const rest = inject(RestService);
const localization = useLocalization();
const confirmation = useConfirmation();
const messages = useValidationMessages();
const list = useListService({
  persistKey: 'Documentation.Catalogue',
  sortKey: 'name',
  sortOrder: 'asc',
});
const category = ref<string | null>(null);
const minPrice = ref<number | null>(null);
const selected = ref<string[]>([]);
const categories = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'reference', label: 'Reference' },
];
watch([list.sortKey, list.sortOrder, list.maxResultCount], () => {
  list.page.value = 0;
});
watch([category, minPrice], () => list.get());
watch([list.filter, category, minPrice], () => {
  selected.value = [];
});
const { items, totalCount, error } = list.hookToQuery((query, signal) =>
  rest.request<never, PagedResultDto<Book>>(
    {
      method: 'GET',
      url: endpoint,
      params: {
        ...query,
        category: category.value ?? undefined,
        minPrice: minPrice.value ?? undefined,
      },
    },
    { signal },
  ),
);
const loading = computed(() => list.requestStatus.value === 'loading');
const columns: AbpTableColumn<Book>[] = [
  { id: 'actions', header: 'Actions' },
  { id: 'name', header: 'Name', sortable: true },
  { id: 'category', header: 'Category' },
  { id: 'price', header: 'Price', sortable: true },
];
const first = computed(() =>
  totalCount.value ? list.page.value * list.maxResultCount.value + 1 : 0,
);
const last = computed(() =>
  Math.min((list.page.value + 1) * list.maxResultCount.value, totalCount.value),
);
function resetFilters(): void {
  list.filter.value = '';
  category.value = null;
  minPrice.value = null;
  list.get();
}
const form = useAbpForm<BookInput>({
  name: { value: '', validators: [Validators.required(), Validators.maxLength(128)] },
  category: { value: 'fiction', validators: [Validators.required()] },
  price: { value: 0, validators: [Validators.required(), Validators.range(0, 1000)] },
});
useServerValidation(form);
const fieldErrors = (key: keyof BookInput) =>
  form.controls[key].touched ? messages(form.controls[key].errors) : [];
const visible = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);
const loadingDetail = ref(false);
const operation = new AbortController();
onBeforeUnmount(() => operation.abort());
const rowActions = computed<RowAction<Book>[]>(() => [
  { text: 'Edit', action: editBook, disabled: loadingDetail.value },
  { text: 'Delete', action: deleteBook, btnClass: 'text-danger' },
]);
function createBook(): void {
  editingId.value = null;
  form.reset({ name: '', category: 'fiction', price: 0 });
  visible.value = true;
}
async function editBook(book: Book): Promise<void> {
  if (loadingDetail.value || saving.value) return;
  loadingDetail.value = true;
  try {
    const detail = await rest.request<never, Book>(
      { method: 'GET', url: `${endpoint}/${book.id}` },
      { signal: operation.signal },
    );
    if (operation.signal.aborted) return;
    editingId.value = detail.id;
    form.reset(detail);
    visible.value = true;
  } catch {
    /* Framework handlers report failure without opening an incomplete editor. */
  } finally {
    loadingDetail.value = false;
  }
}
async function save(): Promise<void> {
  if (saving.value || !form.validate()) return;
  saving.value = true;
  const id = editingId.value;
  try {
    await rest.request<BookInput, Book>(
      { method: id ? 'PUT' : 'POST', url: id ? `${endpoint}/${id}` : endpoint, body: form.value },
      { signal: operation.signal },
    );
    if (operation.signal.aborted) return;
    visible.value = false;
    if (id) list.getWithoutPageReset();
    else list.get();
  } catch {
    /* Keep the draft and server validation errors for correction. */
  } finally {
    saving.value = false;
  }
}
async function deleteBook(book: Book): Promise<void> {
  if (deleting.value) return;
  deleting.value = true;
  try {
    if (
      (await confirmation.warn(
        { key: 'BookStore::DeleteBook', defaultValue: `Delete ${book.name}?` },
        'AbpUi::AreYouSure',
      )) !== ConfirmationStatus.confirm
    )
      return;
    await rest.request<never, void>(
      { method: 'DELETE', url: `${endpoint}/${book.id}` },
      { signal: operation.signal },
    );
    if (operation.signal.aborted) return;
    selected.value = selected.value.filter(id => id !== book.id);
    const lastPage = Math.max(0, Math.ceil((totalCount.value - 1) / list.maxResultCount.value) - 1);
    if (list.page.value > lastPage) list.page.value = lastPage;
    else list.getWithoutPageReset();
  } catch {
    /* A failed deletion keeps the rows and selection. */
  } finally {
    deleting.value = false;
  }
}
</script>
