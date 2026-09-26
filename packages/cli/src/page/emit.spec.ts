import { describe, expect, it } from 'vitest';
import { emitExtensions } from './emit-extensions.js';
import { emitPage } from './emit-page.js';
import type { EntityPage } from './entity.js';

/** A book, which is the entity the design documents measure this generator against. */
const book: EntityPage = {
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
  it('hooks the list to the generated service', () => {
    const source = emitPage(book);

    expect(source).toContain("import { BookService } from '../proxy/book-store/books';");
    expect(source).toContain('const bookService = injectAbp(BookService);');
    expect(source).toContain('list.hookToQuery(query => bookService.getList(query))');
  });

  it('imports every DTO it names, once', () => {
    expect(emitPage(book)).toContain(
      "import type { BookDto, CreateUpdateBookDto } from '../proxy/book-store/books';",
    );
  });

  it('puts a search box on a list endpoint that takes a filter, and not otherwise', () => {
    expect(emitPage(book)).toContain('v-model="list.filter.value"');
    expect(emitPage({ ...book, filter: false })).not.toContain('v-model="list.filter.value"');
  });

  it('re-reads the record before editing it when there is an endpoint for one', () => {
    expect(emitPage(book)).toContain("await bookService.get(record.id ?? '')");
    expect(emitPage({ ...book, reload: false })).toContain(
      'edit: (record: BookDto) => editor.show(record)',
    );
  });

  it('carries the concurrency stamp back when the record has one', () => {
    expect(emitPage(book)).not.toContain('stampOf');
    expect(emitPage({ ...book, concurrencyStamp: true })).toContain(
      'stampOf: record => record.concurrencyStamp',
    );
  });

  it('names the deletion question after the entity, the way ABP does', () => {
    expect(emitPage(book)).toContain(
      "deletionMessage: 'BookStore::BookDeletionConfirmationMessage'",
    );
  });
});

describe('emitExtensions', () => {
  it('writes one column per property, sortable except the enums', () => {
    const source = emitExtensions(book);

    expect(source).toContain("name: 'name',");
    expect(source).toContain('sortable: true,');
    expect(source).toContain("displayName: 'BookStore::PublishDate',");
  });

  it('localizes an enum through ABP’s own key convention', () => {
    const source = emitExtensions(book);

    expect(source).toContain('data.getInjected(LocalizationService)');
    expect(source).toContain('`BookStore::Enum:BookType.${value}`');
    expect(source).toContain(
      '[0, 1, 2].map(value => ({ value, label: bookTypeText(data, value) }))',
    );
    expect(source).toContain('valueResolver: data => bookTypeText(data, data.record.type),');
    expect(source).toContain('options: bookTypeOptions,');
  });

  it('an enum used twice is declared once', () => {
    expect([...emitExtensions(book).matchAll(/const bookTypeText/g)]).toHaveLength(1);
  });

  it('turns the data annotations into validators', () => {
    expect(emitExtensions(book)).toContain(
      'validators: () => [Validators.required(), Validators.maxLength(128)],',
    );
  });

  it('permissions the buttons with what the backend authorizes them with', () => {
    const source = emitExtensions(book);

    expect(source).toContain("permission: 'BookStore.Books.Update',");
    expect(source).toContain("permission: 'BookStore.Books.Delete',");
    expect(source).toContain("permission: 'BookStore.Books.Create',");
  });

  it('leaves the permission off a button the backend does not authorize', () => {
    expect(emitExtensions({ ...book, policies: {} })).not.toContain('permission:');
  });

  it('wraps what it owns in markers, and nothing else', () => {
    const source = emitExtensions(book);

    for (const name of ['imports', 'enums', 'props', 'actions', 'register']) {
      expect(source).toContain(`// abpv:begin ${name}`);
      expect(source).toContain(`// abpv:end ${name}`);
    }

    // The component key and the token are outside them: a page that has been renamed
    // should not be renamed back by a regeneration.
    const key = source.indexOf('export const BOOKS =');
    expect(key).toBeGreaterThan(source.indexOf('// abpv:end imports'));
    expect(key).toBeLessThan(source.indexOf('// abpv:begin enums'));
  });

  it('wires the backend’s object extensions into the same page', () => {
    const source = emitExtensions(book);

    // A property the backend adds to `ObjectExtensions` has to become a column without
    // anyone regenerating anything, which means the mapping has to be called here.
    expect(source).toContain("getObjectExtensionEntities(injector, 'BookStore')");
    expect(source).toContain('mapEntitiesToContributors<BookDto>');
    expect(source).toContain('{ [BOOKS]: entities.Book }');
    expect(source).toContain('fromBackend.prop');
    expect(source).toContain('fromBackend.createForm');
    expect(source).toContain('fromBackend.editForm');
  });

  it('has no enum block when the entity has no enum', () => {
    const plain = emitExtensions({ ...book, columns: [book.columns[0] as never], fields: [] });

    expect(plain).not.toContain('abpv:begin enums');
    expect(plain).not.toContain('LocalizationService');
  });
});
