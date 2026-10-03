import { describe, expect, it } from 'vitest';
import { emitPage } from './emit-page.js';
import type { EntityPage } from './entity.js';

/** A book, which is the entity the design documents measure this generator against. */
const book: EntityPage = {
  module: 'app',
  entity: 'Book',
  plural: 'Books',
  fileBase: 'books',
  componentKey: 'BookStore.BooksComponent',
  resource: 'BookStore',
  extensionModule: 'BookStore',
  extensionEntity: 'Book',
  route: '/books',
  menuKey: 'BookStore::Menu:Books',
  icon: 'bi bi-book',
  service: { name: 'BookService', directory: 'book-store/books' },
  types: { record: 'BookDto', create: 'CreateUpdateBookDto', update: 'CreateUpdateBookDto' },
  columns: [
    { name: 'name', type: 'PropType.String', displayName: 'BookStore::Name', validators: [] },
    {
      name: 'type',
      type: 'PropType.Enum',
      displayName: 'BookStore::Type',
      validators: [],
      enumType: 'BookType',
      enumValues: [0, 1, 2],
      enumIdentifier: 'BookType',
    },
    {
      name: 'publishDate',
      type: 'PropType.Date',
      displayName: 'BookStore::PublishDate',
      validators: [],
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'PropType.String',
      displayName: 'BookStore::Name',
      validators: ['Validators.required()', 'Validators.maxLength(128)'],
    },
    {
      name: 'type',
      type: 'PropType.Enum',
      displayName: 'BookStore::Type',
      validators: [],
      enumType: 'BookType',
      enumValues: [0, 1, 2],
      enumIdentifier: 'BookType',
    },
  ],
  policies: {
    list: 'BookStore.Books',
    create: 'BookStore.Books.Create',
    update: 'BookStore.Books.Update',
    delete: 'BookStore.Books.Delete',
  },
  filter: true,
  reload: true,
  nameProperty: 'name',
  concurrencyStamp: false,
};

describe('emitPage', () => {
  it('puts the template first and keeps the page independent of module extensions', () => {
    const source = emitPage(book);
    expect(source.startsWith('<template>')).toBe(true);
    for (const name of [
      'useRecordEditor',
      'registerBooksExtensions',
      'BOOKS_PAGE',
      'AbpExtensibleTable',
      'AbpRecordModal',
      '.extensions',
    ]) {
      expect(source).not.toContain(name);
    }
    expect(source).toContain('<AbpDataTable');
    expect(source).toContain('<AbpModal');
    expect(source).toContain('async function save()');
  });

  it('keeps business imports when common APIs are automatically imported', () => {
    const source = emitPage(book, true);
    expect(source).not.toContain("from '@lsw-abpvue/");
    expect(source).toContain("import { BookService } from '../proxy/book-store/books';");
    expect(source).toContain('import type { BookDto, CreateUpdateBookDto }');
    expect(source).toContain('useAbpForm');
  });

  it('hooks the list to the generated service', () => {
    expect(emitPage(book)).toContain('list.hookToQuery(query => bookService.getList(query))');
  });

  it('only offers search when the list endpoint takes a filter', () => {
    expect(emitPage(book)).toContain('list.filter.value');
    expect(emitPage({ ...book, filter: false })).not.toContain('list.filter.value');
  });

  it('re-reads the record before editing when an endpoint exists', () => {
    expect(emitPage(book)).toContain("await bookService.get(record.id ?? '')");
    expect(emitPage({ ...book, reload: false })).toContain('selected.value = record;');
  });

  it('defines form controls, validators and localized enum options in the page', () => {
    const source = emitPage(book);
    expect(source).toContain('Validators.required(), Validators.maxLength(128)');
    expect(source).toContain('form.controls.name');
    expect(source).toContain('bookTypeOptions');
    expect(source).toContain('BookStore::Enum:BookType.');
    expect(source).not.toContain('PropData');
  });

  it('keeps permissions on buttons and guards the corresponding methods', () => {
    const source = emitPage(book);
    for (const policy of Object.values(book.policies).filter(
      policy => policy !== book.policies.list,
    )) {
      expect(source).toContain(`policy="${policy}"`);
      expect(source).toContain(`permission.isGranted('${policy}')`);
    }
    expect(emitPage({ ...book, policies: {} })).not.toContain('permission.isGranted');
  });

  it('preserves concurrency stamps explicitly when the record carries one', () => {
    expect(emitPage({ ...book, concurrencyStamp: true })).toContain(
      'concurrencyStamp: selected.value?.concurrencyStamp',
    );
  });

  it('uses the method names resolved by proxy generation', () => {
    const source = emitPage({
      ...book,
      service: {
        ...book.service,
        methods: {
          getList: 'findBooks',
          get: 'findBook',
          create: 'addBook',
          update: 'changeBook',
          delete: 'removeBook',
        },
      },
    });
    for (const name of ['findBooks', 'findBook', 'addBook', 'changeBook', 'removeBook']) {
      expect(source).toContain(`bookService.${name}(`);
    }
  });

  it('does not read write-only fields from the record', () => {
    const source = emitPage({
      ...book,
      fields: [
        {
          name: 'secret',
          type: 'PropType.String',
          displayName: 'BookStore::Secret',
          validators: [],
          recordProperty: false,
        },
      ],
    });
    expect(source).not.toContain('record?.secret');
    expect(source).toContain("secret: ''");
  });

  it('can generate a page with no supported form fields', () => {
    const source = emitPage({ ...book, fields: [] });
    expect(source).not.toContain('function errorsOf');
    expect(source).not.toContain('bookTypeOptions');
  });

  it('names the deletion confirmation and binds unsaved changes to the form', () => {
    const source = emitPage(book);
    expect(source).toContain('BookStore::BookDeletionConfirmationMessage');
    expect(source).toContain(':dirty="form.dirty"');
    expect(source).toContain(':busy="isBusy"');
    expect(source).toContain('@click="close"');
    expect(source).toContain('useServerValidation(form)');
  });
});
