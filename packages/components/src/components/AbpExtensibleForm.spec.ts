import {
  ABP_INJECTOR_KEY,
  createInjector,
  runInInjectionContext,
  type Injector,
} from '@lsw-abpvue/core';
import { Validators } from '@lsw-abpvue/theme-shared';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { PropType } from '../enums/prop-type.js';
import { FormProp } from '../models/form-props.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { EXTENSIONS_IDENTIFIER } from '../tokens/extensions.token.js';
import { mergeWithDefaultProps } from '../utils/merge.js';
import { useExtensibleForm, type ExtensibleForm } from '../utils/use-extensible-form.js';
import AbpExtensibleForm from './AbpExtensibleForm.vue';

interface Book {
  id?: string;
  name?: string;
  isPublished?: boolean;
  extraProperties?: Record<string, unknown>;
}

const BOOKS = 'BookStore.BooksComponent';

const field = (options: Partial<Parameters<typeof FormProp.create<Book>>[0]> = {}) =>
  FormProp.create<Book>({ type: PropType.String, name: 'name', ...options });

interface Setup {
  create?: FormProp<Book>[] | undefined;
  edit?: FormProp<Book>[] | undefined;
}

function assemble({ create = [field()], edit = create }: Setup = {}): Injector {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: EXTENSIONS_IDENTIFIER, useValue: BOOKS },
  ]);

  const extensions = injector.get(ExtensionsService);
  mergeWithDefaultProps(extensions.createFormProps, { [BOOKS]: create });
  mergeWithDefaultProps(extensions.editFormProps, { [BOOKS]: edit });

  return injector;
}

function render(setup: Setup = {}, record?: Book, slots = {}) {
  const injector = assemble(setup);
  const form = runInInjectionContext(injector, () => useExtensibleForm<Book>(record));

  const wrapper = mount(AbpExtensibleForm, {
    props: { form, record } as never,
    slots: slots as never,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: { $t: (key: string) => key },
    },
  });

  return { wrapper, form: form as ExtensibleForm<Book> };
}

const labels = (wrapper: VueWrapper) => wrapper.findAll('label').map(label => label.text());

describe('the fields come from the extension point', () => {
  it('the create form is used when there is no record, the edit form when there is', () => {
    const create = [field({ name: 'name' }), field({ name: 'password', type: PropType.Password })];
    const edit = [field({ name: 'name' })];

    expect(labels(render({ create, edit }).wrapper)).toEqual(['name', 'password']);
    expect(labels(render({ create, edit }, { id: '1', name: 'Dune' }).wrapper)).toEqual(['name']);
  });

  it('an empty record is still a create', () => {
    const { form } = render({}, {});

    expect(form.isEdit).toBe(false);
  });

  it('a field starts at the record, then its default, then nothing', () => {
    const { form } = render(
      {
        create: [
          field({ name: 'name' }),
          field({ name: 'isPublished', type: PropType.Boolean, defaultValue: true }),
          field({ name: 'summary' }),
        ],
      },
      { name: 'Dune' },
    );

    expect(form.form.value).toEqual({ name: 'Dune', isPublished: true, summary: '' });
  });

  it('an extra property is read out of extraProperties and written back into it', () => {
    const { form } = render(
      { create: [field({ name: 'name' }), field({ name: 'Isbn', isExtra: true })] },
      { name: 'Dune', extraProperties: { Isbn: '0441013597' } },
    );

    expect(form.form.get('Isbn')?.value).toBe('0441013597');
    expect(form.toRequestBody()).toEqual({
      name: 'Dune',
      extraProperties: { Isbn: '0441013597' },
    });
  });

  it('a form with no extra properties sends none', () => {
    const { form } = render({}, { name: 'Dune' });

    expect(form.toRequestBody()).toEqual({ name: 'Dune' });
  });

  it('keeps an extra property the form was never given a field for', () => {
    // The backend can declare a property visible in the table and not on the form. A
    // save that dropped it would erase what the user was never shown.
    const { form } = render(
      { create: [field({ name: 'name' })] },
      {
        name: 'Dune',
        extraProperties: { Isbn: '0441013597' },
      },
    );

    expect(form.toRequestBody()).toEqual({
      name: 'Dune',
      extraProperties: { Isbn: '0441013597' },
    });
  });

  it('puts a rejected member nothing is named after in front of the user', async () => {
    const { wrapper, form } = render({ create: [field({ name: 'name' })] }, { name: 'Dune' });

    form.form.setServerErrors([
      { message: 'The IsExternal field is required.', members: ['isExternal'] },
    ]);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="alert"]').text()).toContain('The IsExternal field is required.');
  });

  it('a field that says it is not visible for this record is not rendered', () => {
    const { wrapper } = render(
      { create: [field({ name: 'name' }), field({ name: 'draft', visible: () => false })] },
      { name: 'Dune' },
    );

    expect(labels(wrapper)).toEqual(['name']);
  });
});

describe('the control each type gets', () => {
  const controlFor = (type: PropType, options: Record<string, unknown> = {}) =>
    render({ create: [field({ name: 'value', type, ...options })] }).wrapper;

  it('text types are inputs, and text is a textarea', () => {
    expect(controlFor(PropType.String).find('input').attributes('type')).toBe('text');
    expect(controlFor(PropType.Email).find('input').attributes('type')).toBe('email');
    expect(controlFor(PropType.Number).find('input').attributes('type')).toBe('number');
    expect(controlFor(PropType.Password).find('input').attributes('type')).toBe('password');
    expect(controlFor(PropType.Text).find('textarea').exists()).toBe(true);
  });

  it('a boolean is a toggle', () => {
    expect(controlFor(PropType.Boolean).find('input[type="checkbox"]').exists()).toBe(true);
  });

  it('the three date types are all the date picker', () => {
    for (const type of [PropType.Date, PropType.Time, PropType.DateTime]) {
      expect(
        controlFor(type)
          .find('input[type="datetime-local"], input[type="date"], input[type="time"]')
          .exists(),
      ).toBe(true);
    }
  });

  it('an enum is a select over its options', () => {
    const wrapper = controlFor(PropType.Enum, {
      options: () => [
        { value: 1, label: 'Draft' },
        { value: 2, label: 'Published' },
      ],
    });

    expect(wrapper.findAll('option').map(option => option.text())).toContain('Draft');
  });

  it('options that arrive later are asked for once, not forever', async () => {
    const asked = vi.fn(async () => [{ value: 1, label: 'Draft' }]);
    const { wrapper } = render({
      create: [field({ name: 'kind', type: PropType.Enum, options: asked })],
    });

    await new Promise(resolve => setTimeout(resolve, 20));

    // Reading the resolved value inside the computed that produced the promise would ask
    // again on every settle, one request per turn, until the heap gives up.
    expect(asked).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('option').map(option => option.text())).toContain('Draft');
  });

  it('unrelated request state does not reload asynchronous options', async () => {
    const pending = ref(1);
    const asked = vi.fn(async () => {
      void pending.value;
      return [{ value: 1, label: 'Draft' }];
    });
    const { wrapper } = render({
      create: [field({ name: 'kind', type: PropType.Enum, options: asked })],
    });
    await wrapper.vm.$nextTick();
    pending.value = 0;
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(asked).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('option').map(option => option.text())).toContain('Draft');
    wrapper.unmount();
  });

  it('a multi-select selects more than one', () => {
    const wrapper = controlFor(PropType.MultiSelect, { options: () => [] });

    expect(wrapper.find('select').attributes('multiple')).toBeDefined();
  });

  it('a hidden field is in the form and not on the page', () => {
    const { wrapper, form } = render({
      create: [field({ name: 'id', type: PropType.Hidden }), field({ name: 'name' })],
    });

    expect(labels(wrapper)).toEqual(['name']);
    expect(form.form.get('id')).toBeDefined();
  });
});

describe('validation', () => {
  it('a required field is marked as one', () => {
    const { wrapper } = render({
      create: [field({ name: 'name', validators: () => [Validators.required()] })],
    });

    expect(wrapper.find('label span[aria-hidden="true"]').text()).toBe('*');
  });

  it('the message appears once the field has been left', async () => {
    const { wrapper, form } = render({
      create: [field({ name: 'name', validators: () => [Validators.required()] })],
    });

    expect(wrapper.find('ul li').exists()).toBe(false);

    form.form.get('name')?.markAsTouched();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('ul li').text()).toBe('ThisFieldIsRequired.');
  });

  it('what the server rejected lands on the field it was about', async () => {
    const { wrapper, form } = render({ create: [field({ name: 'name' })] });

    form.form.setServerErrors([{ message: 'That name is taken.', members: ['Name'] }]);
    form.form.get('name')?.markAsTouched();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('ul li').text()).toBe('That name is taken.');
  });

  it('disabled and read-only are asked per record', () => {
    const { wrapper } = render(
      {
        create: [
          field({ name: 'name', readonly: () => true }),
          field({ name: 'summary', disabled: data => data?.record.name === 'Dune' }),
        ],
      },
      { name: 'Dune' },
    );

    const inputs = wrapper.findAll('input');

    expect(inputs[0]?.attributes('readonly')).toBeDefined();
    expect(inputs[1]?.attributes('disabled')).toBeDefined();
  });
});

describe('grouping and custom controls', () => {
  it('a field retains the layout class contributed to it', () => {
    const { wrapper } = render({ create: [field({ className: 'col-md-6' })] });

    expect(wrapper.find('.col-md-6 label').text()).toBe('name');
  });

  it('fields of one group render inside a fieldset that names it', () => {
    const { wrapper } = render({
      create: [
        field({ name: 'street', group: { name: 'address', className: 'row' } }),
        field({ name: 'city', group: { name: 'address' } }),
        field({ name: 'name' }),
      ],
    });

    const fieldset = wrapper.find('fieldset[data-group="address"]');

    expect(fieldset.classes()).toContain('row');
    expect(fieldset.findAll('label').map(label => label.text())).toEqual(['street', 'city']);
  });

  it('a slot replaces one field', () => {
    const { wrapper } = render({}, undefined, {
      'field-name': () => h('p', 'my own control'),
    });

    expect(wrapper.text()).toBe('my own control');
  });

  it('a component on the prop renders the control and binds to it', async () => {
    const Control = defineComponent({
      props: { modelValue: { type: String, default: '' } },
      emits: ['update:modelValue'],
      setup:
        (props, { emit }) =>
        () =>
          h('input', {
            class: 'custom',
            value: props.modelValue,
            onInput: (event: Event) =>
              emit('update:modelValue', (event.target as HTMLInputElement).value),
          }),
    });

    const { wrapper, form } = render({ create: [field({ name: 'name', component: Control })] });

    await wrapper.find('input.custom').setValue('Dune');

    expect(form.form.get('name')?.value).toBe('Dune');
  });
});
