<script setup lang="ts">
/**
 * The sample entity `abp new --sample-crud-page` puts in the backend. Once
 * `abpv proxy add --module app` has run there is a generated `BookService` with these
 * types in `src/proxy`; this page declares them so it compiles before that.
 */
interface BookDto {
  id: string;
  name: string;
  authorId: string;
  authorName: string;
  type: number;
  publishDate: string;
  price: number;
}

const BOOKS = '__APP_NAME__.BooksComponent';

const localization = useLocalization();

/** ABP's `BookType`, whose members the backend localizes as `Enum:BookType.{value}`. */
const BOOK_TYPES = Array.from({ length: 9 }, (_, value) => value);

const bookTypeText = (value: number): string =>
  localization.t(`__APP_NAME__::Enum:BookType.${value}`);

/** Read when the form opens, so a language change is reflected without a reload. */
const bookTypeOptions = (): AbpOption[] =>
  BOOK_TYPES.map(value => ({ value, label: bookTypeText(value) }));

const rest = injectAbp(RestService);

const request = <T,>(
  method: string,
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> => rest.request<unknown, T>({ method, url, body, params }, { apiName: 'Default' });

const BOOKS_PAGE = defineToken<{
  add(): void;
  edit(book: BookDto): void;
  remove(book: BookDto): void;
}>('BooksPage');

const list = useListService({ persistKey: BOOKS });
const { items } = list.hookToQuery((query: PagedAndSortedResultRequestDto) =>
  request<PagedResultDto<BookDto>>('GET', '/api/app/book', undefined, {
    sorting: query.sorting,
    skipCount: query.skipCount,
    maxResultCount: query.maxResultCount,
  }),
);

const extensions = useExtensions();

mergeWithDefaultProps(extensions.entityProps, {
  [BOOKS]: EntityProp.createMany<BookDto>([
    { type: PropType.String, name: 'name', displayName: '__APP_NAME__::Name', sortable: true },
    { type: PropType.String, name: 'authorName', displayName: '__APP_NAME__::Author' },
    {
      type: PropType.Enum,
      name: 'type',
      displayName: '__APP_NAME__::Type',
      valueResolver: data => bookTypeText(data.record.type),
    },
    { type: PropType.Date, name: 'publishDate', displayName: '__APP_NAME__::PublishDate' },
    { type: PropType.Number, name: 'price', displayName: '__APP_NAME__::Price' },
  ]),
});

const fields = FormProp.createMany<BookDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: '__APP_NAME__::Name',
    validators: () => [Validators.required(), Validators.maxLength(128)],
  },
  {
    type: PropType.Enum,
    name: 'authorId',
    displayName: '__APP_NAME__::Author',
    validators: () => [Validators.required()],
    options: () =>
      request<PagedResultDto<{ id: string; name: string }>>('GET', '/api/app/author', undefined, {
        maxResultCount: 1000,
      }).then(result => result.items.map(author => ({ value: author.id, label: author.name }))),
  },
  {
    type: PropType.Enum,
    name: 'type',
    displayName: '__APP_NAME__::Type',
    defaultValue: 0,
    options: bookTypeOptions,
    validators: () => [Validators.required()],
  },
  {
    type: PropType.Date,
    name: 'publishDate',
    displayName: '__APP_NAME__::PublishDate',
    validators: () => [Validators.required()],
  },
  {
    type: PropType.Number,
    name: 'price',
    displayName: '__APP_NAME__::Price',
    defaultValue: 0,
    validators: () => [Validators.required()],
  },
]);

mergeWithDefaultProps(extensions.createFormProps, { [BOOKS]: fields });
mergeWithDefaultProps(extensions.editFormProps, { [BOOKS]: fields });

mergeWithDefaultActions(extensions.entityActions, {
  [BOOKS]: EntityAction.createMany<BookDto>([
    {
      text: 'AbpUi::Edit',
      icon: 'bi bi-pencil',
      permission: '__APP_NAME__.Books.Edit',
      action: data => data.getInjected(BOOKS_PAGE).edit(data.record),
    },
    {
      text: 'AbpUi::Delete',
      icon: 'bi bi-trash',
      permission: '__APP_NAME__.Books.Delete',
      action: data => data.getInjected(BOOKS_PAGE).remove(data.record),
    },
  ]),
});

mergeWithDefaultActions(extensions.toolbarActions, {
  [BOOKS]: ToolbarAction.createMany<readonly BookDto[]>([
    {
      text: '__APP_NAME__::NewBook',
      icon: 'bi bi-plus',
      permission: '__APP_NAME__.Books.Create',
      action: data => data.getInjected(BOOKS_PAGE).add(),
    },
  ]),
});

const editor = useRecordEditor<BookDto>({
  identifier: BOOKS,
  reload: () => list.get(),
  create: body => request<BookDto>('POST', '/api/app/book', body),
  update: (id, body) => request<BookDto>('PUT', `/api/app/book/${id}`, body),
  delete: id => request<void>('DELETE', `/api/app/book/${id}`),
  idOf: book => book.id,
  nameOf: book => book.name,
  deletionMessage: '__APP_NAME__::BookDeletionConfirmationMessage',
  providers: [
    {
      provide: BOOKS_PAGE,
      useValue: {
        add: () => editor.show(),
        edit: async (book: BookDto) =>
          editor.show(await request<BookDto>('GET', `/api/app/book/${book.id}`)),
        remove: (book: BookDto) => editor.remove(book),
      },
    },
  ],
});
</script>

<template>
  <AbpPage title="__APP_NAME__::Menu:Books">
    <template #toolbar>
      <AbpPageToolbar :data="items" />
    </template>

    <AbpExtensibleTable
      :data="items"
      :list="list"
      record-key="id"
      caption="__APP_NAME__::Menu:Books"
    />

    <AbpRecordModal
      :editor="editor"
      label="__APP_NAME__::Menu:Books"
      create-title="__APP_NAME__::NewBook"
    />
  </AbpPage>
</template>
