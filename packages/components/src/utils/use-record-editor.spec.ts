import { ABP_INJECTOR_KEY, createInjector, defineToken, type Injector } from '@lsw-abpvue/core';
import { ConfirmationService, ConfirmationStatus, Validators } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { PropType } from '../enums/prop-type.js';
import { FormProp } from '../models/form-props.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { mergeWithDefaultProps } from './merge.js';
import {
  useRecordEditor,
  type RecordEditor,
  type RecordEditorOptions,
} from './use-record-editor.js';

interface Book {
  id?: string | undefined;
  name?: string | undefined;
  concurrencyStamp?: string | undefined;
}

const BOOKS = 'BookStore.BooksComponent';
const PAGE = defineToken<{ open(): void }>('BOOKS_PAGE');

const FIELDS = FormProp.createMany<Book>([
  { type: PropType.String, name: 'name', displayName: 'Name', id: 'name' },
]);

/** What a page's `setup()` does, without the page. */
function editorIn(
  options: Partial<RecordEditorOptions<Book>> = {},
  answer: ConfirmationStatus = ConfirmationStatus.confirm,
): { editor: RecordEditor<Book>; injector: Injector; unmount(): void } {
  const injector = createInjector([
    ...plainTheme.providers,
    {
      provide: ConfirmationService,
      useValue: { warn: () => Promise.resolve(answer) } as unknown as ConfirmationService,
    },
  ]);
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
          create: () => Promise.resolve({}),
          update: () => Promise.resolve({}),
          delete: () => Promise.resolve(),
          idOf: book => book.id,
          stampOf: book => book.concurrencyStamp,
          nameOf: book => book.name ?? '',
          deletionMessage: 'BookStore::BookDeletionConfirmationMessage',
          ...options,
        });

        return () => h('div');
      },
    }),
    { global: { provide: { [ABP_INJECTOR_KEY]: injector } } },
  );

  return { editor, injector, unmount: () => wrapper.unmount() };
}

const mounted: { unmount(): void }[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
});

function make(
  options: Partial<RecordEditorOptions<Book>> = {},
  answer: ConfirmationStatus = ConfirmationStatus.confirm,
) {
  const result = editorIn(options, answer);
  mounted.push(result);
  return result;
}

function pendingResult<T>() {
  let resolve: (value: T) => void = () => {
    throw new TypeError('The pending test operation has not been initialized.');
  };
  const promise = new Promise<T>(settle => {
    resolve = settle;
  });
  return { promise, resolve };
}

describe('useRecordEditor', () => {
  it('opens on nothing to create, and on a record to edit it', () => {
    const { editor } = make();

    editor.show();
    expect(editor.open.value).toBe(true);
    expect(editor.editing.value).toBeUndefined();
    expect(editor.form.value?.isEdit).toBe(false);

    editor.show({ id: 'book-1', name: 'Dune' });
    expect(editor.editing.value?.name).toBe('Dune');
    expect(editor.form.value?.isEdit).toBe(true);
  });

  it('establishes the page injector the extension points resolve through', () => {
    const { editor } = make({ providers: [{ provide: PAGE, useValue: { open: () => {} } }] });

    expect(editor.injector.get(PAGE)).toBeDefined();
  });

  it('creates when there is no record and updates when there is', async () => {
    const create = vi.fn(() => Promise.resolve({}));
    const update = vi.fn(() => Promise.resolve({}));
    const { editor } = make({ create, update });

    editor.show();
    editor.form.value?.form.controls['name']?.patch('Dune');
    await editor.save();
    expect(create).toHaveBeenCalledWith({ name: 'Dune' });

    editor.show({ id: 'book-1', name: 'Dune', concurrencyStamp: 'stamp-1' });
    await editor.save();
    expect(update).toHaveBeenCalledWith('book-1', {
      name: 'Dune',
      concurrencyStamp: 'stamp-1',
    });
  });

  it('sends what the page collected outside the form', async () => {
    const create = vi.fn(() => Promise.resolve({}));
    const { editor } = make({ create });

    editor.show();
    await editor.save({ roleNames: ['reader'] });

    expect(create).toHaveBeenCalledWith({ name: '', roleNames: ['reader'] });
  });

  it('reloads the list and closes once the save is through', async () => {
    const reload = vi.fn();
    const { editor } = make({ reload });

    editor.show();
    await editor.save();

    expect(editor.open.value).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  // The error handlers have already reported it by the time it lands here. Letting it
  // reject again puts a second, uncaught copy in front of whoever collects those.
  it('stops on a refused save without rejecting a second time', async () => {
    const reload = vi.fn();
    const { editor } = make({
      create: () => Promise.reject(new Error('Book name already exists')),
      reload,
    });

    editor.show();
    await expect(editor.save()).resolves.toBeUndefined();

    expect(editor.open.value).toBe(true);
    expect(editor.busy.value).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('stops on a refused delete without rejecting a second time', async () => {
    const reload = vi.fn();
    const { editor } = make({
      delete: () => Promise.reject(new Error('Book is in use')),
      reload,
    });

    await expect(editor.remove({ id: 'book-1', name: 'Dune' })).resolves.toBeUndefined();
    expect(reload).not.toHaveBeenCalled();
  });

  it('sends nothing while the form is invalid', async () => {
    const create = vi.fn(() => Promise.resolve({}));
    const { editor, injector } = make({ create });

    mergeWithDefaultProps(injector.get(ExtensionsService).createFormProps, {
      [BOOKS]: FormProp.createMany<Book>([
        {
          type: PropType.String,
          name: 'name',
          displayName: 'Name',
          id: 'name',
          validators: () => [Validators.required()],
        },
      ]),
    });

    editor.show();
    await editor.save();

    expect(create).not.toHaveBeenCalled();
    expect(editor.open.value).toBe(true);
  });

  it('asks before deleting, and names the record in the question', async () => {
    const remove = vi.fn(() => Promise.resolve());
    const { editor } = make({ delete: remove });

    await editor.remove({ id: 'book-1', name: 'Dune' });

    expect(remove).toHaveBeenCalledWith('book-1');
  });

  it('does nothing when the answer is no', async () => {
    const remove = vi.fn(() => Promise.resolve());
    const reload = vi.fn();
    const { editor } = make({ delete: remove, reload }, ConfirmationStatus.reject);

    await editor.remove({ id: 'book-1', name: 'Dune' });

    expect(remove).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not delete after its context changes while confirmation is pending', async () => {
    const answer = pendingResult<ConfirmationStatus>();
    const remove = vi.fn(() => Promise.resolve());
    const reload = vi.fn();
    const { editor, injector } = make({ delete: remove, reload });
    vi.spyOn(injector.get(ConfirmationService), 'warn').mockReturnValue(answer.promise);

    const pending = editor.remove({ id: 'book-1', name: 'Dune' });
    expect(editor.invalidate).toBeTypeOf('function');
    editor.invalidate?.();
    answer.resolve(ConfirmationStatus.confirm);
    await pending;

    expect(remove).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('keeps the new editor open when an invalidated create finishes', async () => {
    const created = pendingResult<unknown>();
    const create = vi.fn(() => created.promise);
    const reload = vi.fn();
    const { editor } = make({ create, reload });

    editor.show();
    editor.form.value?.form.controls['name']?.patch('Dune');
    const pending = editor.save();
    expect(create).toHaveBeenCalledOnce();
    editor.invalidate?.();
    expect(editor.open.value).toBe(false);
    editor.show({ id: 'book-2', name: 'Solaris' });
    created.resolve({ id: 'book-1' });
    await pending;

    expect(editor.open.value).toBe(true);
    expect(editor.editing.value?.id).toBe('book-2');
    expect(editor.form.value?.form.controls['name']?.value).toBe('Solaris');
    expect(editor.busy.value).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('asks once and deletes once when removal is repeated before confirmation', async () => {
    const answer = pendingResult<ConfirmationStatus>();
    const remove = vi.fn(() => Promise.resolve());
    const reload = vi.fn();
    const { editor, injector } = make({ delete: remove, reload });
    const warn = vi
      .spyOn(injector.get(ConfirmationService), 'warn')
      .mockReturnValue(answer.promise);

    const first = editor.remove({ id: 'book-1', name: 'Dune' });
    const second = editor.remove({ id: 'book-2', name: 'Solaris' });
    expect(warn).toHaveBeenCalledOnce();
    expect(remove).not.toHaveBeenCalled();
    answer.resolve(ConfirmationStatus.confirm);
    await Promise.all([first, second]);

    expect(remove).toHaveBeenCalledExactlyOnceWith('book-1');
    expect(reload).toHaveBeenCalledOnce();
  });
});
