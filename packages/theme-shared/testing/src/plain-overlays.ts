import { useLocalization } from '@lsw-abpvue/core';
import {
  ConfirmationStatus,
  useConfirmation,
  useModal,
  useToaster,
  type AbpOption,
  type AbpTypeaheadItem,
} from '@lsw-abpvue/theme-shared';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  watch,
  type PropType,
} from 'vue';

/**
 * The other half of the reference theme: the contracts with overlays, lists and async
 * work in them. Native elements throughout -- a `select` rather than a listbox on
 * purpose, so the suite has to be honest about which ARIA pattern it is allowed to
 * require.
 */

export const PlainModal = defineComponent({
  name: 'PlainModal',
  props: {
    visible: { type: Boolean, required: true },
    busy: Boolean,
    size: { type: String, default: undefined },
    centered: Boolean,
    dirty: Boolean,
    suppressUnsavedChangesWarning: Boolean,
    ariaLabel: { type: String, default: undefined },
  },
  emits: ['update:visible', 'init', 'appear', 'disappear'],
  setup(props, { slots, emit }) {
    const { requestClose, markDirty } = useModal(props, () => emit('update:visible', false));
    const dialog = ref<HTMLElement | null>(null);
    const headerId = useId();
    let returnFocusTo: HTMLElement | null = null;

    watch(
      () => props.visible,
      async (open, wasOpen) => {
        // On the immediate first run there is no previous value: a modal that starts
        // closed has not disappeared, it was never there.
        if (!open && wasOpen === undefined) return;

        if (open) {
          emit('init');
          returnFocusTo = document.activeElement as HTMLElement | null;
          await nextTick();
          dialog.value?.focus();
          emit('appear');
          return;
        }

        returnFocusTo?.focus();
        returnFocusTo = null;
        emit('disappear');
      },
      { immediate: true },
    );

    return () =>
      props.visible
        ? h(
            'div',
            {
              ref: dialog,
              role: 'dialog',
              'aria-modal': 'true',
              'aria-labelledby': slots.header ? headerId : undefined,
              'aria-label': slots.header ? undefined : props.ariaLabel,
              'aria-busy': props.busy ? 'true' : undefined,
              tabindex: -1,
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === 'Escape') void requestClose();
              },
            },
            [
              h('header', { id: headerId }, slots.header?.()),
              h('div', { onInput: markDirty, onChange: markDirty }, slots.default?.()),
              h('footer', slots.footer?.({ close: requestClose })),
            ],
          )
        : null;
  },
});

export const PlainToastHost = defineComponent({
  name: 'PlainToastHost',
  props: { containerKey: { type: String, default: undefined } },
  setup(props) {
    const toaster = useToaster();
    const localization = useLocalization();
    const mine = computed(() =>
      toaster.toasts.value.filter(toast => toast.options.containerKey === props.containerKey),
    );

    return () =>
      h(
        'div',
        { 'aria-live': 'polite' },
        mine.value.map(toast =>
          h(
            'div',
            {
              key: String(toast.id),
              role: toast.severity === 'error' ? 'alert' : 'status',
            },
            [
              h(
                'p',
                localization.t(toast.message, ...(toast.options.messageLocalizationParams ?? [])),
              ),
              toast.options.closable === false
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      'aria-label': 'Close',
                      onClick: () => toaster.remove(toast.id),
                    },
                    '×',
                  ),
            ],
          ),
        ),
      );
  },
});

export const PlainConfirmHost = defineComponent({
  name: 'PlainConfirmHost',
  setup() {
    const confirmation = useConfirmation();
    const localization = useLocalization();
    const current = confirmation.current;
    const titleId = useId();

    return () => {
      const request = current.value;
      if (!request) return null;

      const options = request.options;

      return h(
        'div',
        {
          role: 'alertdialog',
          'aria-modal': 'true',
          'aria-labelledby': request.title ? titleId : undefined,
          'aria-label': request.title ? undefined : localization.t(request.message),
          tabindex: -1,
          onKeydown: (event: KeyboardEvent) => {
            if (event.key === 'Escape' && options.dismissible !== false) confirmation.clear();
          },
        },
        [
          request.title ? h('h2', { id: titleId }, localization.t(request.title)) : null,
          h('p', localization.t(request.message)),
          options.hideYesBtn
            ? null
            : h(
                'button',
                {
                  type: 'button',
                  onClick: () => confirmation.clear(ConfirmationStatus.confirm),
                },
                localization.t(options.yesText ?? 'Yes'),
              ),
          options.hideCancelBtn
            ? null
            : h(
                'button',
                {
                  type: 'button',
                  onClick: () => confirmation.clear(ConfirmationStatus.reject),
                },
                localization.t(options.cancelText ?? 'Cancel'),
              ),
        ],
      );
    };
  },
});

export const PlainSelect = defineComponent({
  name: 'PlainSelect',
  props: {
    modelValue: { type: null, default: undefined },
    options: { type: Array as PropType<readonly AbpOption[]>, default: () => [] },
    multiple: Boolean,
    placeholder: { type: String, default: undefined },
    disabled: Boolean,
    readonly: Boolean,
    invalid: Boolean,
    clearable: Boolean,
    id: { type: String, default: undefined },
    name: { type: String, default: undefined },
    ariaDescribedby: { type: String, default: undefined },
    ariaLabel: { type: String, default: undefined },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const byText = new Map<string, unknown>();

    return () => {
      byText.clear();
      for (const option of props.options) byText.set(String(option.value), option.value);

      return h(
        'select',
        {
          id: props.id,
          name: props.name,
          multiple: props.multiple,
          disabled: props.disabled,
          'aria-invalid': props.invalid ? 'true' : undefined,
          'aria-describedby': props.ariaDescribedby,
          'aria-label': props.ariaLabel,
          value: props.multiple ? undefined : String(props.modelValue ?? ''),
          onChange: (event: Event) => {
            const element = event.target as HTMLSelectElement;
            const chosen = props.multiple
              ? [...element.selectedOptions].map(option => byText.get(option.value))
              : byText.get(element.value);
            emit('update:modelValue', chosen);
          },
        },
        [
          props.placeholder ? h('option', { value: '' }, props.placeholder) : null,
          ...props.options.map(option =>
            h(
              'option',
              {
                value: String(option.value),
                disabled: option.disabled,
                selected: props.multiple
                  ? Array.isArray(props.modelValue) && props.modelValue.includes(option.value)
                  : props.modelValue === option.value,
              },
              option.label,
            ),
          ),
        ],
      );
    };
  },
});

const NATIVE_TYPES = { date: 'date', time: 'time', datetime: 'datetime-local' } as const;

export const PlainDatePicker = defineComponent({
  name: 'PlainDatePicker',
  props: {
    modelValue: { type: String as PropType<string | null>, default: null },
    type: { type: String as PropType<'date' | 'time' | 'datetime'>, default: 'date' },
    min: { type: String as PropType<string | null>, default: null },
    max: { type: String as PropType<string | null>, default: null },
    placeholder: { type: String, default: undefined },
    disabled: Boolean,
    readonly: Boolean,
    invalid: Boolean,
    clearable: Boolean,
    id: { type: String, default: undefined },
    name: { type: String, default: undefined },
    ariaDescribedby: { type: String, default: undefined },
    ariaLabel: { type: String, default: undefined },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('span', [
        h('input', {
          type: NATIVE_TYPES[props.type],
          id: props.id,
          name: props.name,
          min: props.min ?? undefined,
          max: props.max ?? undefined,
          value: props.modelValue ?? '',
          disabled: props.disabled,
          readonly: props.readonly,
          'aria-invalid': props.invalid ? 'true' : undefined,
          'aria-describedby': props.ariaDescribedby,
          'aria-label': props.ariaLabel,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value || null),
        }),
        props.clearable
          ? h(
              'button',
              {
                type: 'button',
                'aria-label': 'Clear',
                onClick: () => emit('update:modelValue', null),
              },
              '×',
            )
          : null,
      ]);
  },
});

export const PlainTypeahead = defineComponent({
  name: 'PlainTypeahead',
  props: {
    modelValue: { type: null, default: undefined },
    displayValue: { type: String, default: '' },
    search: {
      type: Function as PropType<
        (term: string, signal: AbortSignal) => Promise<readonly AbpTypeaheadItem[]>
      >,
      required: true,
    },
    debounce: { type: Number, default: 300 },
    minLength: { type: Number, default: 1 },
    placeholder: { type: String, default: undefined },
    disabled: Boolean,
    readonly: Boolean,
    invalid: Boolean,
    clearable: Boolean,
    id: { type: String, default: undefined },
    name: { type: String, default: undefined },
    ariaDescribedby: { type: String, default: undefined },
    ariaLabel: { type: String, default: undefined },
  },
  emits: ['update:modelValue', 'update:displayValue', 'select'],
  setup(props, { emit }) {
    const term = ref(props.displayValue);
    const items = ref<readonly AbpTypeaheadItem[]>([]);
    const open = ref(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running: AbortController | undefined;

    function cancel(): void {
      clearTimeout(timer);
      running?.abort();
      running = undefined;
    }

    onBeforeUnmount(cancel);

    function onInput(event: Event): void {
      term.value = (event.target as HTMLInputElement).value;
      emit('update:displayValue', term.value);
      cancel();

      if (term.value.length < props.minLength) {
        items.value = [];
        open.value = false;
        return;
      }

      timer = setTimeout(() => {
        const controller = new AbortController();
        running = controller;

        void props.search(term.value, controller.signal).then(found => {
          if (controller.signal.aborted) return;
          items.value = found;
          open.value = true;
        });
      }, props.debounce);
    }

    function choose(item: AbpTypeaheadItem): void {
      term.value = item.label;
      open.value = false;
      emit('update:modelValue', item.value);
      emit('update:displayValue', item.label);
      emit('select', item);
    }

    return () =>
      h('div', [
        h('input', {
          type: 'text',
          role: 'combobox',
          id: props.id,
          name: props.name,
          value: term.value,
          disabled: props.disabled,
          readonly: props.readonly,
          placeholder: props.placeholder,
          'aria-expanded': open.value ? 'true' : 'false',
          'aria-invalid': props.invalid ? 'true' : undefined,
          'aria-describedby': props.ariaDescribedby,
          'aria-label': props.ariaLabel,
          onInput,
        }),
        open.value
          ? h(
              'ul',
              { role: 'listbox' },
              items.value.map(item =>
                h(
                  'li',
                  {
                    key: String(item.value),
                    role: 'option',
                    'aria-selected': props.modelValue === item.value ? 'true' : 'false',
                    onClick: () => choose(item),
                  },
                  item.label,
                ),
              ),
            )
          : null,
      ]);
  },
});
