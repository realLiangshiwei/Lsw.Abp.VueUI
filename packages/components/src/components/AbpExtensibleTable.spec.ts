import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  runInInjectionContext,
  StorageService,
  useListService,
  type ApplicationConfigurationDto,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { PropType } from '../enums/prop-type.js';
import { EntityAction } from '../models/actions.js';
import { EntityProp } from '../models/entity-props.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { EXTENSIONS_IDENTIFIER } from '../tokens/extensions.token.js';
import { mergeWithDefaultActions, mergeWithDefaultProps } from '../utils/merge.js';
import AbpExtensibleTable from './AbpExtensibleTable.vue';

interface Book {
  id: string;
  name: string;
  isPublished: boolean;
  extraProperties?: Record<string, unknown>;
}

const BOOKS = 'BookStore.BooksComponent';

const books: Book[] = [
  { id: '1', name: 'Dune', isPublished: true, extraProperties: { Isbn: '0441013597' } },
  { id: '2', name: 'Neuromancer', isPublished: false, extraProperties: { Isbn: '0441569595' } },
];

const defaultProps = [
  EntityProp.create<Book>({ type: PropType.String, name: 'name', sortable: true }),
  EntityProp.create<Book>({ type: PropType.Boolean, name: 'isPublished' }),
];

interface Setup {
  props?: EntityProp<Book>[] | undefined;
  actions?: EntityAction<Book>[] | undefined;
  policies?: Record<string, boolean> | undefined;
  providers?: ProviderInput[] | undefined;
}

function assemble({ props = defaultProps, actions = [], policies = {}, providers = [] }: Setup) {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: EXTENSIONS_IDENTIFIER, useValue: BOOKS },
    ...providers,
  ]);

  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: policies },
  } as ApplicationConfigurationDto);

  const extensions = injector.get(ExtensionsService);
  mergeWithDefaultProps(extensions.entityProps, { [BOOKS]: props });
  mergeWithDefaultActions(extensions.entityActions, { [BOOKS]: actions });

  return injector;
}

function render(setup: Setup = {}, tableProps: Record<string, unknown> = {}, slots = {}) {
  const injector = assemble(setup);
  const list = runInInjectionContext(injector, () =>
    useListService(tableProps.persistKey ? { persistKey: String(tableProps.persistKey) } : {}),
  );
  list.totalCount.value = books.length;

  const wrapper = mount(AbpExtensibleTable, {
    props: { data: books, list, recordKey: 'id', ...tableProps } as never,
    slots: slots as never,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: unknown) =>
          typeof key === 'string' ? key : (key as { defaultValue: string }).defaultValue,
      },
    },
  });

  return { wrapper, list, injector };
}

const headers = (wrapper: VueWrapper) => wrapper.findAll('th').map(cell => cell.text());
const column = (wrapper: VueWrapper, name: string) =>
  wrapper.findAll(`td[data-column="${name}"]`).map(cell => cell.text());

describe('the columns come from the extension point', () => {
  it('renders a column per prop, in the order the contributors left them', () => {
    const { wrapper } = render();

    expect(headers(wrapper)).toEqual(['name', 'isPublished']);
    expect(column(wrapper, 'name')).toEqual(['Dune', 'Neuromancer']);
  });

  it('a column added by a contributor needs no change to the page', () => {
    const injector = assemble({});
    const extensions = injector.get(ExtensionsService);
    mergeWithDefaultProps(
      extensions.entityProps,
      { [BOOKS]: defaultProps },
      {
        [BOOKS]: [
          propList =>
            propList.addTail(
              EntityProp.create<Book>({ type: PropType.String, name: 'Isbn', isExtra: true }),
            ),
        ],
      },
    );

    const list = runInInjectionContext(injector, () => useListService());
    const wrapper = mount(AbpExtensibleTable, {
      props: { data: books, list, recordKey: 'id' } as never,
      global: {
        provide: { [ABP_INJECTOR_KEY]: injector },
        mocks: { $t: (key: string) => key },
      },
    });

    expect(headers(wrapper)).toEqual(['name', 'isPublished', 'Isbn']);
    expect(column(wrapper, 'Isbn')).toEqual(['0441013597', '0441569595']);
  });

  it('a column the user has no permission for is not rendered', () => {
    const { wrapper } = render({
      props: [
        ...defaultProps,
        EntityProp.create<Book>({
          type: PropType.String,
          name: 'internalNote',
          permission: 'BookStore.Books.Manage',
        }),
      ],
    });

    expect(headers(wrapper)).not.toContain('internalNote');
  });

  it('columnVisible decides before any row exists', () => {
    const { wrapper } = render({
      props: [
        ...defaultProps,
        EntityProp.create<Book>({
          type: PropType.String,
          name: 'draft',
          columnVisible: () => false,
        }),
      ],
    });

    expect(headers(wrapper)).not.toContain('draft');
  });

  it('a boolean cell reads as a word rather than as true and false', () => {
    const { wrapper } = render();

    // The localizer falls back to the key's own text when the backend has no resource
    // for it, which is what an empty configuration in a test amounts to.
    expect(column(wrapper, 'isPublished')).toEqual(['Yes', 'No']);
  });

  it('an enum cell shows the label of the value', () => {
    const { wrapper } = render({
      props: [
        EntityProp.create<Book>({
          type: PropType.Enum,
          name: 'id',
          enumList: [
            { value: '1', label: 'First' },
            { value: '2', label: 'Second' },
          ],
        }),
      ],
    });

    expect(column(wrapper, 'id')).toEqual(['First', 'Second']);
  });

  it('a row where the prop is not visible has an empty cell, and the column stays', () => {
    const { wrapper } = render({
      props: [
        EntityProp.create<Book>({
          type: PropType.String,
          name: 'name',
          visible: data => data?.record.isPublished === true,
        }),
      ],
    });

    expect(column(wrapper, 'name')).toEqual(['Dune', '']);
  });
});

describe('custom rendering', () => {
  it('a slot takes over one column', () => {
    const { wrapper } = render(
      {},
      {},
      {
        'cell-name': ({ row }: { row: Book }) => h('a', { href: `/books/${row.id}` }, row.name),
      },
    );

    expect(wrapper.find('td[data-column="name"] a').attributes('href')).toBe('/books/1');
  });

  it('a component on the prop renders the cell, and can reach the row', () => {
    const Cell = defineComponent({
      props: { record: { type: Object, required: true } },
      setup: props => () => h('em', (props.record as Book).name.toUpperCase()),
    });

    const { wrapper } = render({
      props: [EntityProp.create<Book>({ type: PropType.String, name: 'name', component: Cell })],
    });

    expect(wrapper.find('td[data-column="name"] em').text()).toBe('DUNE');
  });

  it('a column with an action of its own is a button', async () => {
    const clicked = vi.fn();
    const { wrapper } = render({
      props: [
        EntityProp.create<Book>({
          type: PropType.String,
          name: 'name',
          action: data => clicked(data.record.id),
        }),
      ],
    });

    await wrapper.find('td[data-column="name"] button').trigger('click');

    expect(clicked).toHaveBeenCalledWith('1');
  });
});

describe('row actions', () => {
  const edit = EntityAction.create<Book>({ text: 'AbpUi::Edit', action: () => {} });

  it('there is no actions column when there are no actions', () => {
    expect(headers(render().wrapper)).not.toContain('AbpUi::Actions');
  });

  it('one action is a button that runs with the row', async () => {
    const acted = vi.fn();
    const { wrapper } = render({
      actions: [
        EntityAction.create<Book>({ text: 'AbpUi::Edit', action: data => acted(data.record.id) }),
      ],
    });

    await wrapper.find('td[data-column="__actions"] button').trigger('click');

    expect(acted).toHaveBeenCalledWith('1');
  });

  it('several actions collapse into one disclosure per row', () => {
    const { wrapper } = render({
      actions: [edit, EntityAction.create<Book>({ text: 'AbpUi::Delete', action: () => {} })],
    });

    expect(wrapper.findAll('td[data-column="__actions"] details')).toHaveLength(2);
    expect(wrapper.find('td[data-column="__actions"] summary').text()).toBe('AbpUi::Actions');
  });

  it('an action the user may not perform is not offered', () => {
    const { wrapper } = render({
      actions: [
        edit,
        EntityAction.create<Book>({
          text: 'AbpUi::Delete',
          action: () => {},
          permission: 'BookStore.Books.Delete',
        }),
      ],
    });

    // Only the edit button is left, so the disclosure is not needed at all.
    expect(wrapper.find('td[data-column="__actions"] details').exists()).toBe(false);
    expect(wrapper.find('td[data-column="__actions"] button').text()).toBe('AbpUi::Edit');
  });

  it('an action can hide itself for one row', () => {
    const { wrapper } = render({
      actions: [
        edit,
        EntityAction.create<Book>({
          text: 'AbpUi::Delete',
          action: () => {},
          visible: data => data?.record.isPublished === false,
        }),
      ],
    });

    const rows = wrapper.findAll('td[data-column="__actions"]');

    expect(rows[0]?.find('details').exists()).toBe(false);
    expect(rows[1]?.find('details').exists()).toBe(true);
  });

  it('the actions column can be renamed and resized', () => {
    const { wrapper } = render({ actions: [edit] }, { actionsText: 'BookStore::Manage' });

    expect(headers(wrapper)).toContain('Manage');
  });
});

describe('paging and sorting', () => {
  it('sorting a column tells the list what to ask for', async () => {
    const { wrapper, list } = render();

    await wrapper.find('th button').trigger('click');

    expect(list.sortKey.value).toBe('name');
    expect(list.sortOrder.value).toBe('asc');
  });

  it('a new sort goes back to the first page', async () => {
    const { wrapper, list } = render();
    list.page.value = 4;

    await wrapper.find('th button').trigger('click');

    expect(list.page.value).toBe(0);
  });

  it('the pager says what is being shown', () => {
    const { wrapper } = render();

    expect(wrapper.find('.abp-table-info').text()).toBe('PagerInfo{0}{1}{2}');
  });
});

describe('remembering the hidden columns', () => {
  function storageOf(values = new Map<string, string>()) {
    const storage: StorageService = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => void values.set(key, value),
      removeItem: key => void values.delete(key),
      keys: () => [...values.keys()],
      onChange: () => () => {},
    };

    return { values, provider: { provide: StorageService, useValue: storage } };
  }

  it('a column the user hid stays hidden on the next visit', () => {
    const { values, provider } = storageOf();
    values.set(
      'abpvue.list.BookStore.Books.anonymous',
      JSON.stringify({ hiddenColumns: ['isPublished'] }),
    );

    const { wrapper } = render({ providers: [provider] }, { persistKey: 'BookStore.Books' });

    expect(headers(wrapper)).toEqual(['name']);
  });

  it('hiding a column is stored under the same key the list uses', async () => {
    const { values, provider } = storageOf();
    const { wrapper } = render({ providers: [provider] }, { persistKey: 'BookStore.Books' });

    await wrapper.setProps({ hiddenColumns: ['name'] });

    expect(JSON.parse(values.get('abpvue.list.BookStore.Books.anonymous') ?? '{}')).toEqual({
      hiddenColumns: ['name'],
    });
    expect(headers(wrapper)).toEqual(['isPublished']);
  });

  it('a table with no key at all stores nothing', async () => {
    const { values, provider } = storageOf();
    const { wrapper } = render({ providers: [provider] });

    await wrapper.setProps({ hiddenColumns: ['name'] });

    expect(values.size).toBe(0);
  });
});

describe('what a page can put around the table', () => {
  it('the toolbar, the empty state and the row detail are all slots', async () => {
    const { wrapper } = render(
      {},
      { expandable: true },
      {
        toolbar: () => h('button', 'New book'),
        'expanded-row': ({ row }: { row: Book }) => h('p', `about ${row.name}`),
      },
    );

    expect(wrapper.find('.abp-table-toolbar button').text()).toBe('New book');

    await wrapper.setProps({ expanded: ['1'] });

    expect(wrapper.find('.abp-table-detail').text()).toBe('about Dune');
  });
});
