import { ABP_INJECTOR_KEY, createInjector } from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import type { AbpTableColumn } from '../models/table.js';
import AbpDataTable from './AbpDataTable.vue';

interface Book {
  id: string;
  name: string;
  price: number;
}

const books: Book[] = [
  { id: '1', name: 'Dune', price: 10 },
  { id: '2', name: 'Neuromancer', price: 12 },
];

const columns: AbpTableColumn<Book>[] = [
  { id: 'name', header: 'Name', sortable: true, width: 250 },
  { id: 'price', header: 'Price', value: book => `${book.price} EUR` },
];

function render(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  // `mount` cannot instantiate the type parameter of a generic component, so the props
  // and the slots arrive erased here. What they have to be is checked where it counts:
  // in a template, by `vue-tsc`, in the playground's extensions page.
  return mount(AbpDataTable, {
    props: { columns, data: books, recordKey: 'id', ...props } as never,
    slots: slots as never,
    global: {
      provide: { [ABP_INJECTOR_KEY]: createInjector([...plainTheme.providers]) },
      mocks: {
        $t: (key: unknown) =>
          typeof key === 'string' ? key : (key as { defaultValue: string }).defaultValue,
      },
    },
  });
}

const cells = (wrapper: VueWrapper, column: string) =>
  wrapper.findAll(`td[data-column="${column}"]`).map(cell => cell.text());

describe('AbpDataTable', () => {
  it('renders a row per record and a cell per column', () => {
    const wrapper = render();

    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(cells(wrapper, 'name')).toEqual(['Dune', 'Neuromancer']);
  });

  it('a column can say how to read its value', () => {
    expect(cells(render(), 'price')).toEqual(['10 EUR', '12 EUR']);
  });

  it('the headers are column headers, and a caption names the table', () => {
    const wrapper = render({ caption: 'Books' });

    expect(wrapper.findAll('th[scope="col"]').map(cell => cell.text())).toEqual(['Name', 'Price']);
    expect(wrapper.find('caption').text()).toBe('Books');
  });

  it('a cell slot replaces what the column would have rendered', () => {
    const wrapper = render(
      {},
      { 'cell-name': ({ row }: { row: Book }) => h('a', { href: `/books/${row.id}` }, row.name) },
    );

    expect(wrapper.find('td[data-column="name"] a').attributes('href')).toBe('/books/1');
  });

  it('says there is nothing to show when there is nothing', () => {
    const wrapper = render({ data: [] });

    expect(wrapper.find('tbody tr').text()).toBe('AbpUi::NoDataAvailableInDatatable');
    expect(wrapper.find('tbody tr td').attributes('colspan')).toBe('2');
  });

  it('the empty state is a slot, for a page that wants to offer something instead', () => {
    const wrapper = render({ data: [] }, { empty: () => h('button', 'Add the first book') });

    expect(wrapper.find('tbody button').text()).toBe('Add the first book');
  });

  it('shows nothing but the spinner while a request is in flight', () => {
    const wrapper = render({ data: [], loading: true });

    expect(wrapper.find('.abp-table-empty').exists()).toBe(false);
    expect(wrapper.find('.abp-table-loading').exists()).toBe(true);
  });
});

describe('sorting', () => {
  const header = (wrapper: VueWrapper, index: number) => wrapper.findAll('th')[index];

  it('only a sortable column carries aria-sort', () => {
    const wrapper = render();

    expect(header(wrapper, 0)?.attributes('aria-sort')).toBe('none');
    expect(header(wrapper, 1)?.attributes('aria-sort')).toBeUndefined();
  });

  it('clicking cycles ascending, descending, off', async () => {
    const wrapper = render();
    const button = wrapper.find('th button');

    await button.trigger('click');
    expect(wrapper.emitted('update:sortKey')?.at(-1)).toEqual(['name']);
    expect(wrapper.emitted('update:sortOrder')?.at(-1)).toEqual(['asc']);
    expect(header(wrapper, 0)?.attributes('aria-sort')).toBe('ascending');

    await button.trigger('click');
    expect(wrapper.emitted('update:sortOrder')?.at(-1)).toEqual(['desc']);
    expect(header(wrapper, 0)?.attributes('aria-sort')).toBe('descending');

    await button.trigger('click');
    expect(wrapper.emitted('update:sortOrder')?.at(-1)).toEqual(['']);
    expect(wrapper.emitted('update:sortKey')?.at(-1)).toEqual(['']);
    expect(header(wrapper, 0)?.attributes('aria-sort')).toBe('none');
  });

  it('sorting by another column starts that one ascending', async () => {
    const wrapper = render({ sortKey: 'price', sortOrder: 'desc' });

    await wrapper.find('th button').trigger('click');

    expect(wrapper.emitted('update:sortKey')?.at(-1)).toEqual(['name']);
    expect(wrapper.emitted('update:sortOrder')?.at(-1)).toEqual(['asc']);
  });

  it('a column that is not sortable has no button to press', () => {
    expect(render().findAll('th button')).toHaveLength(1);
  });
});

describe('selection', () => {
  it('there is no selection column unless the table is selectable', () => {
    expect(render().find('.abp-table-select').exists()).toBe(false);
  });

  it('selecting a row reports its key', async () => {
    const wrapper = render({ selectable: true });

    await wrapper.findAll('tbody input[type="checkbox"]')[1]?.setValue(true);

    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['2']]);
  });

  it('the header box selects and clears the whole page', async () => {
    const wrapper = render({ selectable: true, selected: ['1'] });

    await wrapper.find('thead input[type="checkbox"]').setValue(true);
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['1', '2']]);

    await wrapper.setProps({ selected: ['1', '2'] });
    await wrapper.find('thead input[type="checkbox"]').setValue(false);
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([[]]);
  });

  it('a selected row says so, for a theme to colour it', () => {
    const wrapper = render({ selectable: true, selected: ['1'] });

    expect(wrapper.findAll('tbody tr')[0]?.classes()).toContain('abp-table-row-selected');
  });
});

describe('row detail', () => {
  it('a row is expanded and collapsed, and says which it is', async () => {
    const wrapper = render(
      { expandable: true },
      { 'expanded-row': ({ row }: { row: Book }) => h('p', `about ${row.name}`) },
    );
    const toggle = wrapper.find('tbody button');

    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(wrapper.find('.abp-table-detail').exists()).toBe(false);

    await toggle.trigger('click');
    await wrapper.setProps({ expanded: ['1'] });

    expect(wrapper.find('.abp-table-detail').text()).toBe('about Dune');
    expect(wrapper.find('tbody button').attributes('aria-expanded')).toBe('true');
  });

  it('the detail row spans every column there is', async () => {
    const wrapper = render(
      { expandable: true, selectable: true, expanded: ['1'] },
      { 'expanded-row': () => h('p', 'detail') },
    );

    expect(wrapper.find('.abp-table-detail td').attributes('colspan')).toBe('4');
  });
});

describe('the toolbar', () => {
  it('is there only when something was put in it', () => {
    expect(render().find('.abp-table-toolbar').exists()).toBe(false);
    expect(
      render({}, { toolbar: () => h('button', 'New book') })
        .find('.abp-table-toolbar button')
        .text(),
    ).toBe('New book');
  });
});
