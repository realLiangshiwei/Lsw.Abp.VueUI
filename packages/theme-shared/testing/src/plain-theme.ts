import { provideThemeComponents, type AbpOption } from '@lsw-abpvue/theme-shared';
import { computed, defineComponent, h, useId, type PropType, type VNodeChild } from 'vue';
import type { ThemeUnderTest } from './harness.js';
import {
  PlainConfirmHost,
  PlainDatePicker,
  PlainModal,
  PlainSelect,
  PlainToastHost,
  PlainTypeahead,
} from './plain-overlays.js';

/**
 * The contracts implemented with nothing but native elements. It exists to keep the
 * suite honest: a second implementation, built on none of the things `theme-basic` is
 * built on, is the only way to tell an assertion about behaviour from an assertion about
 * reka-ui.
 */

const PlainButton = defineComponent({
  name: 'PlainButton',
  props: {
    type: { type: String as PropType<'button' | 'submit' | 'reset'>, default: 'button' },
    loading: Boolean,
    disabled: Boolean,
    block: Boolean,
    outline: Boolean,
    iconClass: { type: String, default: undefined },
    ariaLabel: { type: String, default: undefined },
    variant: { type: String, default: undefined },
    size: { type: String, default: undefined },
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () =>
      h(
        'button',
        {
          type: props.type,
          disabled: props.disabled || props.loading,
          'aria-busy': props.loading ? 'true' : undefined,
          'aria-label': props.ariaLabel,
          onClick: (event: MouseEvent) => emit('click', event),
        },
        [props.iconClass ? h('i', { class: props.iconClass }) : null, slots.default?.()],
      );
  },
});

const PlainSpinner = defineComponent({
  name: 'PlainSpinner',
  props: {
    size: { type: String, default: undefined },
    label: { type: String, default: 'Loading' },
    overlay: Boolean,
  },
  setup(props) {
    return () => h('span', { role: 'status', 'aria-label': props.label });
  },
});

const PlainFormField = defineComponent({
  name: 'PlainFormField',
  props: {
    label: { type: String, default: undefined },
    for: { type: String, default: undefined },
    required: Boolean,
    disabled: Boolean,
    hint: { type: String, default: undefined },
    errors: { type: Array as PropType<readonly string[]>, default: () => [] },
  },
  setup(props, { slots }) {
    const generated = useId();
    const id = computed(() => props.for ?? generated);
    const invalid = computed(() => props.errors.length > 0);
    const hintId = computed(() => `${id.value}-hint`);
    const errorsId = computed(() => `${id.value}-errors`);
    const describedBy = computed(() => {
      const ids = [props.hint ? hintId.value : null, invalid.value ? errorsId.value : null];
      return ids.filter(Boolean).join(' ') || undefined;
    });

    return () =>
      h('div', [
        props.label
          ? h('label', { for: id.value }, [
              props.label,
              props.required ? h('span', { 'aria-hidden': 'true' }, '*') : null,
            ])
          : null,
        slots.default?.({ id: id.value, describedBy: describedBy.value, invalid: invalid.value }),
        props.hint ? h('p', { id: hintId.value }, props.hint) : null,
        invalid.value
          ? h(
              'ul',
              { id: errorsId.value },
              props.errors.map(error => h('li', error)),
            )
          : null,
      ]);
  },
});

const PlainInput = defineComponent({
  name: 'PlainInput',
  props: {
    modelValue: { type: [String, Number] as PropType<string | number | null>, default: null },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: undefined },
    disabled: Boolean,
    readonly: Boolean,
    invalid: Boolean,
    id: { type: String, default: undefined },
    name: { type: String, default: undefined },
    rows: { type: Number, default: undefined },
    ariaDescribedby: { type: String, default: undefined },
    ariaLabel: { type: String, default: undefined },
  },
  emits: ['update:modelValue', 'blur', 'focus'],
  setup(props, { emit }) {
    const textarea = computed(() => props.type === 'textarea');

    return () =>
      h(textarea.value ? 'textarea' : 'input', {
        id: props.id,
        name: props.name,
        type: textarea.value ? undefined : props.type,
        rows: props.rows,
        value: props.modelValue ?? '',
        placeholder: props.placeholder,
        disabled: props.disabled,
        readonly: props.readonly,
        'aria-invalid': props.invalid ? 'true' : undefined,
        'aria-describedby': props.ariaDescribedby,
        'aria-label': props.ariaLabel,
        onInput: (event: Event) => {
          const value = (event.target as HTMLInputElement).value;
          emit('update:modelValue', props.type === 'number' ? Number(value) : value);
        },
        onBlur: (event: FocusEvent) => emit('blur', event),
        onFocus: (event: FocusEvent) => emit('focus', event),
      });
  },
});

const PlainToggle = defineComponent({
  name: 'PlainToggle',
  props: {
    modelValue: { type: null, default: undefined },
    variant: { type: String as PropType<'checkbox' | 'switch' | 'radio'>, default: 'checkbox' },
    label: { type: String, default: undefined },
    options: { type: Array as PropType<readonly AbpOption[]>, default: () => [] },
    disabled: Boolean,
    readonly: Boolean,
    invalid: Boolean,
    indeterminate: Boolean,
    id: { type: String, default: undefined },
    name: { type: String, default: undefined },
    ariaLabel: { type: String, default: undefined },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const group = (): VNodeChild =>
      h(
        'div',
        { role: 'radiogroup', 'aria-label': props.ariaLabel ?? props.label },
        props.options.map(option =>
          h('label', [
            h('input', {
              type: 'radio',
              name: props.name ?? props.id,
              value: String(option.value),
              checked: props.modelValue === option.value,
              disabled: props.disabled || option.disabled,
              onChange: () => emit('update:modelValue', option.value),
            }),
            option.label,
          ]),
        ),
      );

    const single = (): VNodeChild =>
      h('label', [
        h('input', {
          type: 'checkbox',
          role: props.variant === 'switch' ? 'switch' : undefined,
          id: props.id,
          name: props.name,
          checked: props.modelValue === true,
          disabled: props.disabled,
          'aria-invalid': props.invalid ? 'true' : undefined,
          'aria-label': props.ariaLabel,
          onChange: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).checked),
        }),
        props.label,
      ]);

    return () => (props.variant === 'radio' ? group() : single());
  },
});

const PlainPagination = defineComponent({
  name: 'PlainPagination',
  props: {
    page: { type: Number, required: true },
    pageSize: { type: Number, required: true },
    total: { type: Number, required: true },
    siblingCount: { type: Number, default: 1 },
    showSizeSelector: Boolean,
    pageSizes: { type: Array as PropType<readonly number[]>, default: () => [10, 25, 50] },
    disabled: Boolean,
    ariaLabel: { type: String, default: 'Pagination' },
  },
  emits: ['update:page', 'update:pageSize'],
  setup(props, { emit }) {
    const pages = computed(() => {
      const count = Math.max(1, Math.ceil(props.total / props.pageSize));
      return Array.from({ length: count }, (_unused, index) => index);
    });

    return () =>
      h('nav', { 'aria-label': props.ariaLabel }, [
        h(
          'ul',
          pages.value.map(index =>
            h('li', [
              h(
                'button',
                {
                  type: 'button',
                  disabled: props.disabled,
                  'aria-current': index === props.page ? 'page' : undefined,
                  onClick: () => emit('update:page', index),
                },
                String(index + 1),
              ),
            ]),
          ),
        ),
        props.showSizeSelector
          ? h(
              'select',
              {
                'aria-label': 'Page size',
                value: String(props.pageSize),
                onChange: (event: Event) =>
                  emit('update:pageSize', Number((event.target as HTMLSelectElement).value)),
              },
              props.pageSizes.map(size => h('option', { value: String(size) }, String(size))),
            )
          : null,
      ]);
  },
});

/**
 * The reference theme as a whole. Exported so a package above the contract layer can
 * render its own components in a test without pulling a real theme in.
 */
export const plainTheme: ThemeUnderTest = {
  name: 'plain',
  providers: [
    provideThemeComponents({
      AbpButton: PlainButton,
      AbpSpinner: PlainSpinner,
      AbpFormField: PlainFormField,
      AbpInput: PlainInput,
      AbpToggle: PlainToggle,
      AbpPagination: PlainPagination,
      AbpModal: PlainModal,
      AbpToastHost: PlainToastHost,
      AbpConfirmHost: PlainConfirmHost,
      AbpSelect: PlainSelect,
      AbpDatePicker: PlainDatePicker,
      AbpTypeahead: PlainTypeahead,
    }),
  ],
};
