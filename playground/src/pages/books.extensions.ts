// What this page contributes to the extension system: its columns, its form fields and
// its buttons. This is the file to edit -- a column removed here is a column gone, and a
// third-party package can add its own through the same extension points.
//
// `abpv generate --force` rewrites what is inside the `abpv:begin` markers and leaves
// everything else alone.

// abpv:begin imports
import {
  EntityAction,
  EntityProp,
  FormProp,
  getObjectExtensionEntities,
  mapEntitiesToContributors,
  mergeWithDefaultActions,
  mergeWithDefaultProps,
  PropType,
  ToolbarAction,
  useExtensions,
} from '@lsw-abpvue/components';
import type { PropData } from '@lsw-abpvue/components';
import { defineToken, getCurrentInjector, LocalizationService } from '@lsw-abpvue/core';
import { Validators } from '@lsw-abpvue/theme-shared';
import type { AbpOption } from '@lsw-abpvue/theme-shared';
import type { BookDto } from '../proxy/book-store/books';
// abpv:end imports

/** The page's key in the extension system: a contributor addresses the page by it. */
export const BOOKS = 'BookStore.BooksComponent';

/** What the page's own buttons call; the page provides it. */
export const BOOKS_PAGE = defineToken<{
  add(): void;
  edit(record: BookDto): void;
  remove(record: BookDto): void;
}>('BooksPage');

// abpv:begin enums
/** ABP localizes an enum member under `Enum:{Type}.{value}` of its own resource. */
const bookTypeText = (data: PropData<BookDto>, value: unknown): string =>
  data.getInjected(LocalizationService).t(`BookStore::Enum:BookType.${value}`);

const bookTypeOptions = (data: PropData<BookDto>): AbpOption[] =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8].map(value => ({ value, label: bookTypeText(data, value) }));
// abpv:end enums

// abpv:begin props
export const BOOK_ENTITY_PROPS = EntityProp.createMany<BookDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'BookStore::Name',
    sortable: true,
  },
  {
    type: PropType.Enum,
    name: 'type',
    displayName: 'BookStore::Type',
    valueResolver: data => bookTypeText(data, data.record.type),
  },
  {
    type: PropType.Date,
    name: 'publishDate',
    displayName: 'BookStore::PublishDate',
    sortable: true,
  },
  {
    type: PropType.Number,
    name: 'price',
    displayName: 'BookStore::Price',
    sortable: true,
  },
]);

export const BOOK_FORM_PROPS = FormProp.createMany<BookDto>([
  {
    type: PropType.String,
    name: 'name',
    displayName: 'BookStore::Name',
    validators: () => [Validators.required(), Validators.maxLength(128), Validators.minLength(1)],
  },
  {
    type: PropType.Enum,
    name: 'type',
    displayName: 'BookStore::Type',
    options: bookTypeOptions,
    validators: () => [Validators.required()],
  },
  {
    type: PropType.Date,
    name: 'publishDate',
    displayName: 'BookStore::PublishDate',
    validators: () => [Validators.required()],
  },
  {
    type: PropType.Number,
    name: 'price',
    displayName: 'BookStore::Price',
    validators: () => [Validators.required(), Validators.range(0, 1000)],
  },
]);
// abpv:end props

// abpv:begin actions
export const BOOK_ENTITY_ACTIONS = EntityAction.createMany<BookDto>([
  {
    text: 'AbpUi::Edit',
    icon: 'bi bi-pencil',
    permission: 'BookStore.Books.Update',
    action: data => data.getInjected(BOOKS_PAGE).edit(data.record),
  },
  {
    text: 'AbpUi::Delete',
    icon: 'bi bi-trash',
    permission: 'BookStore.Books.Delete',
    action: data => data.getInjected(BOOKS_PAGE).remove(data.record),
  },
]);

export const BOOK_TOOLBAR_ACTIONS = ToolbarAction.createMany<readonly BookDto[]>([
  {
    text: 'BookStore::NewBook',
    icon: 'bi bi-plus',
    permission: 'BookStore.Books.Create',
    action: data => data.getInjected(BOOKS_PAGE).add(),
  },
]);
// abpv:end actions

// abpv:begin register
/** Puts all of it on the page. The page calls it once, from its `setup`. */
export function registerBooksExtensions(): void {
  const injector = getCurrentInjector();
  if (!injector) return;

  const extensions = useExtensions();

  // Whatever the backend declares in `ObjectExtensions` for this entity becomes a
  // column and a form field here, with no regeneration: it arrives in the
  // application configuration at runtime.
  const entities = getObjectExtensionEntities(injector, 'BookStore');
  const fromBackend = mapEntitiesToContributors<BookDto>(
    injector,
    { [BOOKS]: entities.Book },
    'BookStore',
  );

  mergeWithDefaultProps(extensions.entityProps, { [BOOKS]: BOOK_ENTITY_PROPS }, fromBackend.prop);
  mergeWithDefaultProps(
    extensions.createFormProps,
    { [BOOKS]: BOOK_FORM_PROPS },
    fromBackend.createForm,
  );
  mergeWithDefaultProps(
    extensions.editFormProps,
    { [BOOKS]: BOOK_FORM_PROPS },
    fromBackend.editForm,
  );
  mergeWithDefaultActions(extensions.entityActions, { [BOOKS]: BOOK_ENTITY_ACTIONS });
  mergeWithDefaultActions(extensions.toolbarActions, {
    [BOOKS]: BOOK_TOOLBAR_ACTIONS,
  });
}
// abpv:end register
