import { ABP_INJECTOR_KEY, createInjector } from '@lsw-abpvue/core';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { PropType } from '../enums/prop-type.js';
import { FormProp } from '../models/form-props.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { mergeWithDefaultProps } from '../utils/merge.js';
import { useRecordEditor, type RecordEditor } from '../utils/use-record-editor.js';
import AbpRecordModal from './AbpRecordModal.vue';

interface Book {
  id?: string | undefined;
  name?: string | undefined;
}

const BOOKS = 'BookStore.BooksComponent';

const FIELDS = FormProp.createMany<Book>([
  { type: PropType.String, name: 'name', displayName: 'BookStore::Name', id: 'name' },
]);

const mounted: VueWrapper[] = [];

const created = vi.fn(() => Promise.resolve({}));

/** The dialog renders into the body, so the buttons are looked up there. */
function click(text: string): void {
  const buttons = [...document.body.querySelectorAll('button')];
  buttons.find(button => button.textContent?.includes(text))?.click();
}

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  created.mockClear();
});

/** The dialog inside a page, which is the only place its editor can come from. */
function render(props: Record<string, unknown> = {}, body?: () => unknown) {
  const injector = createInjector([...plainTheme.providers]);
  const extensions = injector.get(ExtensionsService);
  mergeWithDefaultProps(extensions.createFormProps, { [BOOKS]: FIELDS });
  mergeWithDefaultProps(extensions.editFormProps, { [BOOKS]: FIELDS });

  let editor!: RecordEditor<Book>;

  const wrapper = mount(
    defineComponent({
      setup() {
        editor = useRecordEditor<Book>({
          identifier: BOOKS,
          reload: () => {},
          create: created,
          update: () => Promise.resolve({}),
          delete: () => Promise.resolve(),
          idOf: book => book.id,
          nameOf: book => book.name ?? '',
          deletionMessage: 'BookStore::BookDeletionConfirmationMessage',
        });

        return () =>
          h(
            AbpRecordModal,
            {
              editor,
              label: 'BookStore::Menu:Books',
              createTitle: 'BookStore::NewBook',
              ...props,
              // The generic parameter is not inferable through `h()`.
            } as never,
            body ? { default: body } : undefined,
          );
      },
    }),
    {
      global: {
        provide: { [ABP_INJECTOR_KEY]: injector },
        mocks: { $t: (key: string) => key },
      },
      attachTo: document.body,
    },
  );

  mounted.push(wrapper);

  return { wrapper, editor };
}

describe('AbpRecordModal', () => {
  it('is not in the document until the editor opens', async () => {
    const { wrapper, editor } = render();

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    editor.show();
    await wrapper.vm.$nextTick();

    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('heads a create with the given title and an edit with the framework key', async () => {
    const { wrapper, editor } = render();

    editor.show();
    await wrapper.vm.$nextTick();
    expect(document.body.textContent).toContain('BookStore::NewBook');

    editor.show({ id: 'book-1', name: 'Dune' });
    await wrapper.vm.$nextTick();
    expect(document.body.textContent).toContain('AbpUi::Edit');
  });

  it('renders the form the extension system assembled', async () => {
    const { wrapper, editor } = render();

    editor.show();
    await wrapper.vm.$nextTick();

    expect(document.body.querySelector('#name')).not.toBeNull();
  });

  it('a page that collects more than the form puts it in the body slot', async () => {
    const { wrapper, editor } = render({}, () => h('p', 'the roles tab'));

    editor.show();
    await wrapper.vm.$nextTick();

    expect(document.body.textContent).toContain('the roles tab');
    expect(document.body.querySelector('#name')).toBeNull();
  });

  it('the save button saves the form', async () => {
    const { wrapper, editor } = render();

    editor.show();
    await wrapper.vm.$nextTick();
    (document.body.querySelector('#name') as HTMLInputElement).value = 'Dune';
    (document.body.querySelector('#name') as HTMLInputElement).dispatchEvent(
      new Event('input', { bubbles: true }),
    );
    click('AbpUi::Save');
    await flush();

    expect(created).toHaveBeenCalled();
  });

  it('a page that saves more than the form takes the button over', async () => {
    const save = vi.fn();
    const { wrapper, editor } = render({ save });

    editor.show();
    await wrapper.vm.$nextTick();
    click('AbpUi::Save');
    await flush();

    expect(save).toHaveBeenCalled();
    expect(created).not.toHaveBeenCalled();
  });

  it('closes on cancel without saving', async () => {
    const { wrapper, editor } = render();

    editor.show();
    await wrapper.vm.$nextTick();

    click('AbpUi::Cancel');
    await wrapper.vm.$nextTick();

    expect(editor.open.value).toBe(false);
  });
});
