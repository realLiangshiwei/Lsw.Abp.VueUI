<template>
  <AbpPage title="__APP_NAME__::Menu:Books">
    <template #toolbar>
      <AbpPermission policy="__APP_NAME__.Books.Create">
        <AbpButton :disabled="isBusy" @click="createBook">
          <i class="bi bi-plus me-1" aria-hidden="true" />
          {{ t('__APP_NAME__::NewBook') }}
        </AbpButton>
      </AbpPermission>
    </template>

    <div class="card">
      <AbpDataTable
        v-model:sort-key="list.sortKey.value"
        v-model:sort-order="list.sortOrder.value"
        :columns="columns"
        :data="items"
        :loading="list.requestStatus.value === 'loading'"
        :caption="t('__APP_NAME__::Menu:Books')"
        record-key="id"
      >
        <template #cell-actions="{ row }">
          <AbpGridActions :record="row" :actions="rowActions" :disabled="isBusy" />
        </template>
      </AbpDataTable>
      <div class="card-footer d-flex flex-wrap align-items-center justify-content-between gap-3">
        <p class="text-muted small mb-0">{{ pageInfo }}</p>
        <AbpPagination
          v-model:page="list.page.value"
          v-model:page-size="list.maxResultCount.value"
          :total="list.totalCount.value"
          :disabled="list.requestStatus.value === 'loading'"
          show-size-selector
        />
      </div>
    </div>

    <AbpModal v-model:visible="isModalOpen" :dirty="form.dirty" :busy="isBusy">
      <template #header>
        <h2 class="h5 mb-0">{{ t(selected ? 'AbpUi::Edit' : '__APP_NAME__::NewBook') }}</h2>
      </template>
      <form id="books-form" class="d-grid gap-3" @submit.prevent="save">
        <AbpFormField
          v-slot="{ id, describedBy, invalid }"
          :label="t('__APP_NAME__::Name')"
          :errors="errorsOf('name')"
          required
        >
          <AbpInput
            :id="id"
            :model-value="form.controls.name.value"
            :aria-describedby="describedBy"
            :invalid="invalid"
            :disabled="isBusy"
            @update:model-value="form.controls.name.value = String($event ?? '')"
            @blur="form.controls.name.markAsTouched()"
          />
        </AbpFormField>
        <AbpFormField
          v-slot="{ id, describedBy, invalid }"
          :label="t('__APP_NAME__::Author')"
          :errors="errorsOf('authorId')"
          required
        >
          <AbpSelect
            :id="id"
            :options="authorOptions"
            :model-value="form.controls.authorId.value"
            :aria-describedby="describedBy"
            :invalid="invalid"
            :disabled="isBusy"
            @update:model-value="form.controls.authorId.value = String($event ?? '')"
            @blur="form.controls.authorId.markAsTouched()"
          />
        </AbpFormField>
        <AbpFormField
          v-slot="{ id, describedBy, invalid }"
          :label="t('__APP_NAME__::Type')"
          :errors="errorsOf('type')"
          required
        >
          <AbpSelect
            :id="id"
            :model-value="form.controls.type.value"
            :aria-describedby="describedBy"
            :invalid="invalid"
            :disabled="isBusy"
            :options="bookTypeOptions"
            @update:model-value="
              form.controls.type.value = typeof $event === 'number' ? $event : null
            "
            @blur="form.controls.type.markAsTouched()"
          />
        </AbpFormField>
        <AbpFormField
          v-slot="{ id, describedBy, invalid }"
          :label="t('__APP_NAME__::PublishDate')"
          :errors="errorsOf('publishDate')"
          required
        >
          <AbpDatePicker
            :id="id"
            :model-value="form.controls.publishDate.value"
            :aria-describedby="describedBy"
            :invalid="invalid"
            :disabled="isBusy"
            @update:model-value="form.controls.publishDate.value = $event"
            @blur="form.controls.publishDate.markAsTouched()"
          />
        </AbpFormField>
        <AbpFormField
          v-slot="{ id, describedBy, invalid }"
          :label="t('__APP_NAME__::Price')"
          :errors="errorsOf('price')"
          required
        >
          <AbpInput
            :id="id"
            :model-value="form.controls.price.value"
            :aria-describedby="describedBy"
            :invalid="invalid"
            :disabled="isBusy"
            type="number"
            :step="0.01"
            @update:model-value="
              form.controls.price.value = $event === null || $event === '' ? null : Number($event)
            "
            @blur="form.controls.price.markAsTouched()"
          />
        </AbpFormField>
        <div
          v-for="message in form.unmatchedServerErrors"
          :key="message"
          class="alert alert-danger"
          role="alert"
        >
          {{ message }}
        </div>
      </form>
      <template #footer="{ close }">
        <AbpButton variant="secondary" outline :disabled="isBusy" @click="close">{{
          t('AbpUi::Cancel')
        }}</AbpButton>
        <AbpButton type="submit" form="books-form" :loading="isBusy">{{
          t('AbpUi::Save')
        }}</AbpButton>
      </template>
    </AbpModal>
  </AbpPage>
</template>

<script setup lang="ts">
interface BookDto {
  id: string;
  name: string;
  authorId: string;
  authorName: string;
  type: number;
  publishDate: string;
  price: number;
}
type CreateUpdateBookDto = Pick<BookDto, 'name' | 'authorId' | 'type' | 'publishDate' | 'price'>;
const rest = injectAbp(RestService);
const request = <T,>(
  method: string,
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> => rest.request<unknown, T>({ method, url, body, params }, { apiName: 'Default' });
const bookService = {
  getList: (query: PagedAndSortedResultRequestDto) =>
    request<PagedResultDto<BookDto>>('GET', '/api/app/book', undefined, { ...query }),
  get: (id: string) => request<BookDto>('GET', `/api/app/book/${id}`),
  create: (input: CreateUpdateBookDto) => request<BookDto>('POST', '/api/app/book', input),
  update: (id: string, input: CreateUpdateBookDto) =>
    request<BookDto>('PUT', `/api/app/book/${id}`, input),
  delete: (id: string) => request<void>('DELETE', `/api/app/book/${id}`),
};
const authors = ref<{ id: string; name: string }[]>([]);
const authorOptions = computed<AbpOption[]>(() =>
  authors.value.map(author => ({ value: author.id, label: author.name })),
);
async function loadAuthors(): Promise<void> {
  const result = await request<PagedResultDto<{ id: string; name: string }>>(
    'GET',
    '/api/app/author',
    undefined,
    { maxResultCount: 1000 },
  );
  authors.value = result.items;
}
const { t, currentLang } = useLocalization();
const permission = usePermission();
const confirmation = useConfirmation();
const toaster = useToaster();
const validationMessages = useValidationMessages();

const list = useListService({ persistKey: '__APP_NAME__.BooksComponent' });
const { items } = list.hookToQuery(query => bookService.getList(query));
watch([list.sortKey, list.sortOrder, list.maxResultCount], () => {
  list.page.value = 0;
});

const pageInfo = computed(() => {
  const first = list.page.value * list.maxResultCount.value;
  return t(
    'AbpUi::PagerInfo{0}{1}{2}',
    items.value.length ? first + 1 : 0,
    Math.min(first + items.value.length, list.totalCount.value),
    list.totalCount.value,
  );
});

const isModalOpen = ref(false);
const isBusy = ref(false);
const selected = shallowRef<BookDto>();
const form = useAbpForm({
  name: { value: '', validators: [Validators.required(), Validators.maxLength(128)] },
  authorId: { value: '', validators: [Validators.required()] },
  type: { value: null as number | null, validators: [Validators.required()] },
  publishDate: { value: null as string | null, validators: [Validators.required()] },
  price: { value: null as number | null, validators: [Validators.required()] },
});
useServerValidation(form);

function errorsOf(name: keyof typeof form.controls): string[] {
  const field = form.controls[name];
  return field.touched ? validationMessages(field.errors) : [];
}

const bookTypeOptions = computed<AbpOption[]>(() =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8].map(value => ({
    value,
    label: t(`__APP_NAME__::Enum:BookType.${value}`),
  })),
);

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(currentLang.value).format(date);
}

const rowActions = computed<RowAction<BookDto>[]>(() => [
  ...(permission.isGranted('__APP_NAME__.Books.Edit')
    ? [{ text: 'AbpUi::Edit', action: editBook }]
    : []),
  ...(permission.isGranted('__APP_NAME__.Books.Delete')
    ? [{ text: 'AbpUi::Delete', action: deleteBook }]
    : []),
]);
const columns = computed<AbpTableColumn<BookDto>[]>(() => [
  ...(rowActions.value.length ? [{ id: 'actions', header: t('AbpUi::Actions') }] : []),
  { id: 'name', header: t('__APP_NAME__::Name'), sortable: true },
  { id: 'authorName', header: t('__APP_NAME__::Author') },
  {
    id: 'type',
    header: t('__APP_NAME__::Type'),
    value: row => t(`__APP_NAME__::Enum:BookType.${row.type}`),
  },
  {
    id: 'publishDate',
    header: t('__APP_NAME__::PublishDate'),
    value: row => formatDate(row.publishDate),
  },
  { id: 'price', header: t('__APP_NAME__::Price') },
]);

function buildForm(record?: BookDto): void {
  form.reset({
    name: record?.name ?? '',
    authorId: record?.authorId ?? '',
    type: record?.type ?? null,
    publishDate: record?.publishDate ?? null,
    price: record?.price ?? null,
  });
}

async function createBook(): Promise<void> {
  if (isBusy.value || !permission.isGranted('__APP_NAME__.Books.Create')) return;
  isBusy.value = true;
  try {
    await loadAuthors();
    selected.value = undefined;
    buildForm();
    isModalOpen.value = true;
  } catch {
    // The HTTP error handler has already reported the failed request.
  } finally {
    isBusy.value = false;
  }
}

async function editBook(record: BookDto): Promise<void> {
  if (isBusy.value || !permission.isGranted('__APP_NAME__.Books.Edit')) return;
  isBusy.value = true;
  try {
    await loadAuthors();
    selected.value = await bookService.get(record.id ?? '');
    buildForm(selected.value);
    isModalOpen.value = true;
  } catch {
    // The HTTP error handler has already reported the failed request.
  } finally {
    isBusy.value = false;
  }
}

async function save(): Promise<void> {
  if (isBusy.value || !isModalOpen.value || !form.validate()) return;
  if (
    !permission.isGranted(selected.value ? '__APP_NAME__.Books.Edit' : '__APP_NAME__.Books.Create')
  )
    return;
  isBusy.value = true;
  const body = {
    ...selected.value,
    ...form.value,
  };
  try {
    if (selected.value?.id) {
      await bookService.update(selected.value.id, body as CreateUpdateBookDto);
    } else {
      await bookService.create(body as CreateUpdateBookDto);
    }
    isModalOpen.value = false;
    toaster.success('AbpUi::SavedSuccessfully');
    list.get();
  } catch {
    // Keep the form open; HTTP and validation handlers report the failure.
  } finally {
    isBusy.value = false;
  }
}

async function deleteBook(record: BookDto): Promise<void> {
  if (isBusy.value || !permission.isGranted('__APP_NAME__.Books.Delete')) return;
  const answer = await confirmation.warn(
    '__APP_NAME__::BookDeletionConfirmationMessage',
    'AbpUi::AreYouSure',
    {
      messageLocalizationParams: [String(record.name ?? '')],
    },
  );
  if (answer !== ConfirmationStatus.confirm) return;
  isBusy.value = true;
  try {
    await bookService.delete(record.id ?? '');
    toaster.success('AbpUi::DeletedSuccessfully');
    list.get();
  } catch {
    // The HTTP error handler has already reported the failed request.
  } finally {
    isBusy.value = false;
  }
}
</script>
