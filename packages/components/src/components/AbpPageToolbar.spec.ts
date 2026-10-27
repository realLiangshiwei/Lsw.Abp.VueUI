import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
} from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type PropType } from 'vue';
import { ToolbarAction } from '../models/actions.js';
import type { PropData } from '../models/prop-data.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { EXTENSIONS_IDENTIFIER } from '../tokens/extensions.token.js';
import { mergeWithDefaultActions } from '../utils/merge.js';
import AbpPageToolbar from './AbpPageToolbar.vue';

interface Book {
  id: string;
  name: string;
}

const BOOKS = 'BookStore.BooksComponent';
const books: Book[] = [{ id: '1', name: 'Dune' }];

function render(
  actions: ToolbarAction<readonly Book[]>[],
  policies: Record<string, boolean> = {},
  slots: {
    action?: (scope: {
      action: ToolbarAction<readonly unknown[]>;
      data: PropData<readonly unknown[]>;
    }) => unknown;
  } = {},
) {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: EXTENSIONS_IDENTIFIER, useValue: BOOKS },
  ]);

  const configState = injector.get(ConfigStateService);
  configState.setState({
    ...configState.snapshot(),
    auth: { grantedPolicies: policies },
  } as ApplicationConfigurationDto);

  mergeWithDefaultActions(injector.get(ExtensionsService).toolbarActions, { [BOOKS]: actions });

  return mount(AbpPageToolbar, {
    props: { data: books } as never,
    slots,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
}

describe('AbpPageToolbar', () => {
  it('renders a contributed component with the current toolbar data', () => {
    const component = defineComponent({
      props: { data: { type: Object as PropType<PropData<readonly Book[]>>, required: true } },
      setup: props => () => h('p', props.data.record.map(book => book.name).join(', ')),
    });
    const wrapper = render([
      ToolbarAction.create<readonly Book[]>({ text: 'Custom', component, action: () => {} }),
    ]);
    expect(wrapper.get('p').text()).toBe('Dune');
    expect(wrapper.find('button').exists()).toBe(false);
    wrapper.unmount();
  });

  it('passes permitted actions and current records to a custom action slot', async () => {
    const acted = vi.fn();
    const wrapper = render(
      [
        ToolbarAction.create<readonly Book[]>({
          text: 'Custom',
          action: data => acted(data.record),
        }),
        ToolbarAction.create<readonly Book[]>({
          text: 'Hidden',
          permission: 'Denied',
          action: () => {},
        }),
      ],
      {},
      {
        action: ({ action, data }) =>
          h('button', { onClick: () => action.action(data) }, action.text),
      },
    );
    expect(wrapper.findAll('button').map(button => button.text())).toEqual(['Custom']);
    await wrapper.get('button').trigger('click');
    expect(acted).toHaveBeenCalledWith(books);
    wrapper.unmount();
  });

  it('renders a button per toolbar action', () => {
    const wrapper = render([
      ToolbarAction.create<readonly Book[]>({ text: 'AbpUi::New', action: () => {} }),
      ToolbarAction.create<readonly Book[]>({ text: 'AbpUi::Delete', action: () => {} }),
    ]);

    expect(wrapper.findAll('button').map(button => button.text())).toEqual([
      'AbpUi::New',
      'AbpUi::Delete',
    ]);
  });

  it('an action is handed the whole page of records', async () => {
    const acted = vi.fn();
    const wrapper = render([
      ToolbarAction.create<readonly Book[]>({
        text: 'AbpUi::Delete',
        action: data => acted(data.record.length),
      }),
    ]);

    await wrapper.find('button').trigger('click');

    expect(acted).toHaveBeenCalledWith(1);
  });

  it('an action the user may not perform is not offered', () => {
    const wrapper = render([
      ToolbarAction.create<readonly Book[]>({
        text: 'AbpUi::New',
        action: () => {},
        permission: 'BookStore.Books.Create',
      }),
    ]);

    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('the same action appears once the permission is granted', () => {
    const wrapper = render(
      [
        ToolbarAction.create<readonly Book[]>({
          text: 'AbpUi::New',
          action: () => {},
          permission: 'BookStore.Books.Create',
        }),
      ],
      { 'BookStore.Books.Create': true },
    );

    expect(wrapper.find('button').text()).toBe('AbpUi::New');
  });
});
