import {
  provideAbp,
  runInInjectionContext,
  type Injector,
  type LocalizationParam,
} from '@lsw-abpvue/core';
import {
  ConfirmationStatus,
  useConfirmation,
  useServerValidation,
  useToaster,
} from '@lsw-abpvue/theme-shared';
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import { EXTENSIONS_IDENTIFIER } from '../tokens/extensions.token.js';
import { useExtensibleForm, type ExtensibleForm } from './use-extensible-form.js';

/** The two requests that save a record and the one that removes it. */
export interface RecordCommands<R> {
  create(body: Record<string, unknown>): Promise<unknown>;
  update(id: string, body: Record<string, unknown>): Promise<unknown>;
  delete(id: string): Promise<unknown>;
  /** Which record this is; an absent id is what makes a save a create. */
  idOf(record: R): string | undefined;
  /** ABP rejects an update that does not carry back the stamp it handed out. */
  stampOf?: ((record: R) => string | undefined) | undefined;
  /** What the confirmation names, usually the record's own name. */
  nameOf(record: R): string;
  /** Localization key of the "will be deleted" question. */
  deletionMessage: LocalizationParam;
}

export interface RecordEditor<R> {
  /** The record the dialog is on; `undefined` while creating one. */
  readonly editing: ShallowRef<R | undefined>;
  /** The form of whichever fields the extension system assembled. */
  readonly form: ShallowRef<ExtensibleForm<R> | undefined>;
  readonly open: Ref<boolean>;
  readonly busy: Ref<boolean>;
  /** The injector the page's buttons and forms are resolved from. */
  readonly injector: Injector;
  /** Opens the dialog on a record, or on nothing to create one. */
  show(record?: R | undefined): void;
  /**
   * Validates, sends, closes, says so and reloads the list. A rejected request has
   * already been reported to the error handlers by the time it lands here, so it stops
   * the save without becoming a second, uncaught report.
   *
   * @param extra Merged into the body: what the page collected outside the form
   */
  save(extra?: Record<string, unknown>): Promise<void>;
  /** Asks first; deletes, says so and reloads the list when the answer is yes. */
  remove(record: R): Promise<void>;
}

export interface RecordEditorOptions<R> extends RecordCommands<R> {
  /** The component key of the page, for the extension system. */
  identifier: string;
  /** Reloads the list after a save or a delete. */
  reload(): void;
  /** Extra providers the page's own buttons are resolved through. */
  providers?: Parameters<typeof provideAbp>[0] | undefined;
}

/**
 * The dialog half of a page built on the extension system: open a record, save it,
 * remove it. Three pages had the same forty lines of it -- the identity users and roles
 * pages and the tenants page -- and the differences between them are the options above.
 *
 * Call it in `setup()`: it establishes the page's injector, which is what the extension
 * points and the module's own buttons resolve through.
 *
 * @param options The requests, the component key and what to reload
 */
export function useRecordEditor<R>(options: RecordEditorOptions<R>): RecordEditor<R> {
  const confirmation = useConfirmation();
  const toaster = useToaster();

  const editing = shallowRef<R>();
  const form = shallowRef<ExtensibleForm<R>>();
  const open = ref(false);
  const busy = ref(false);

  // The page says which component key it is before anything reads it. An `inject()` after
  // this line still sees the parent's injector (api-parity-map §2), so the returned one
  // is also what the forms and the buttons are built in, long after setup is over.
  const injector = provideAbp([
    { provide: EXTENSIONS_IDENTIFIER, useValue: options.identifier },
    ...(options.providers ?? []),
  ]);

  // Registered once, for whichever form is open: a rejected save lands on its fields.
  useServerValidation({ setServerErrors: errors => form.value?.form.setServerErrors(errors) });

  function show(record?: R | undefined): void {
    editing.value = record;
    form.value = runInInjectionContext(injector, () => useExtensibleForm<R>(record));
    open.value = true;
  }

  async function save(extra: Record<string, unknown> = {}): Promise<void> {
    if (!form.value?.form.validate()) return;

    const body = { ...form.value.toRequestBody(), ...extra };
    const current = editing.value;
    const id = current === undefined ? undefined : options.idOf(current);
    busy.value = true;

    try {
      // The fields came from the extension system, so their shape is only known at
      // runtime; the server is what rejects a body that is missing something.
      if (current !== undefined && id) {
        const stamp = options.stampOf?.(current);
        await options.update(id, stamp === undefined ? body : { ...body, concurrencyStamp: stamp });
      } else {
        await options.create(body);
      }

      open.value = false;
      toaster.success('AbpUi::SavedSuccessfully');
      options.reload();
    } catch {
      // Reported already; swallowing it here is what keeps a refused save from also
      // arriving as an unhandled rejection.
    } finally {
      busy.value = false;
    }
  }

  async function remove(record: R): Promise<void> {
    const answer = await confirmation.warn(options.deletionMessage, 'AbpUi::AreYouSure', {
      messageLocalizationParams: [options.nameOf(record)],
    });
    if (answer !== ConfirmationStatus.confirm) return;

    try {
      await options.delete(options.idOf(record) ?? '');
      toaster.success('AbpUi::DeletedSuccessfully');
      options.reload();
    } catch {
      // As above.
    }
  }

  return { editing, form, open, busy, injector, show, save, remove };
}
