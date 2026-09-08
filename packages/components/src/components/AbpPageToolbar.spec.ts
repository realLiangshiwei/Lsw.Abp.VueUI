import {
  ABP_INJECTOR_KEY,
  ConfigStateService,
  createInjector,
  type ApplicationConfigurationDto,
} from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ToolbarAction } from '../models/actions.js';
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

function render(actions: ToolbarAction<readonly Book[]>[], policies: Record<string, boolean> = {}) {
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
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => key },
    },
  });
}

describe('AbpPageToolbar', () => {
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
