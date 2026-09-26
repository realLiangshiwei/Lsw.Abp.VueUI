import {
  ABP_INJECTOR_KEY,
  createInjector,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import {
  FeaturesService,
  type GetFeatureListResultDto,
  type IStringValueType,
} from '@lsw-abpvue/feature-management/proxy';
import { ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import { expectAccessible, plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AbpFeatureManagement from './AbpFeatureManagement.vue';

const toggle = { name: 'ToggleStringValueType', properties: {} };

const ANSWER: GetFeatureListResultDto = {
  groups: [
    {
      name: 'Printing',
      displayName: 'Printing',
      features: [
        {
          name: 'Print',
          displayName: 'Print',
          value: 'false',
          depth: 0,
          valueType: toggle,
          provider: { name: 'D' },
        },
        {
          name: 'Print.Colour',
          displayName: 'In colour',
          value: 'false',
          depth: 1,
          parentName: 'Print',
          valueType: toggle,
          provider: { name: 'D' },
        },
        {
          name: 'Print.MaxCopies',
          displayName: 'Maximum copies',
          value: '10',
          depth: 1,
          parentName: 'Print',
          valueType: {
            name: 'FreeTextStringValueType',
            properties: {},
            validator: { name: 'NUMERIC', properties: { MinValue: 1, MaxValue: 100 } },
          },
          provider: { name: 'D' },
        },
        {
          name: 'Print.PaperSize',
          displayName: 'Paper size',
          value: 'A4',
          depth: 1,
          parentName: 'Print',
          valueType: {
            name: 'SelectionStringValueType',
            properties: {},
            itemSource: {
              items: [
                { value: 'A4', displayText: { resourceName: 'BookStore', name: 'Paper.A4' } },
                {
                  value: 'Letter',
                  displayText: { resourceName: 'BookStore', name: 'Paper.Letter' },
                },
              ],
            },
          } as IStringValueType,
          provider: { name: 'D' },
        },
      ],
    },
  ],
};

const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

interface Spies {
  update?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
  answer?: GetFeatureListResultDto;
}

function featuresService(spies: Spies = {}): ProviderInput {
  return {
    provide: FeaturesService,
    useValue: {
      get: () => Promise.resolve(spies.answer ?? ANSWER),
      update: spies.update ?? (() => Promise.resolve()),
      delete: spies.remove ?? (() => Promise.resolve()),
    } as unknown as FeaturesService,
  };
}

async function render(injector: Injector, providerKey?: string): Promise<VueWrapper> {
  const wrapper: VueWrapper = mount(AbpFeatureManagement, {
    attachTo: document.body,
    props: { visible: true, providerName: 'T', providerKey },
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      mocks: {
        $t: (key: string | { defaultValue: string }) =>
          typeof key === 'string' ? key : key.defaultValue,
      },
    },
  });

  mounted.push(wrapper);
  await new Promise(resolve => setTimeout(resolve));
  await wrapper.vm.$nextTick();

  return wrapper;
}

const dialog = (): HTMLElement => document.body;

describe('AbpFeatureManagement', () => {
  it('renders a control for each value type', async () => {
    await render(createInjector([...plainTheme.providers, featuresService()]));

    expect(dialog().querySelectorAll('input[type="checkbox"]').length).toBe(2);
    expect(dialog().querySelector('input[type="number"]')).not.toBeNull();
    expect(dialog().querySelector('select')).not.toBeNull();
  });

  it('is accessible', async () => {
    await render(createInjector([...plainTheme.providers, featuresService()]));

    await expectAccessible(dialog());
  });

  it('bounds the numeric box the way the validator does', async () => {
    await render(createInjector([...plainTheme.providers, featuresService()]));
    const box = dialog().querySelector('input[type="number"]') as HTMLInputElement;

    expect(box.min).toBe('1');
    expect(box.max).toBe('100');
  });

  it('switches the parent on with the child, and sends both', async () => {
    const update = vi.fn(() => Promise.resolve());
    const wrapper = await render(
      createInjector([...plainTheme.providers, featuresService({ update })]),
      'tenant-1',
    );

    const boxes = dialog().querySelectorAll('input[type="checkbox"]');
    (boxes[1] as HTMLInputElement).click();
    await wrapper.vm.$nextTick();

    const save = [...dialog().querySelectorAll('button')].find(
      button => button.textContent?.trim() === 'AbpUi::Save',
    );
    save?.click();
    await new Promise(resolve => setTimeout(resolve));

    expect(update).toHaveBeenCalledWith('T', 'tenant-1', {
      features: [
        { name: 'Print', value: 'true' },
        { name: 'Print.Colour', value: 'true' },
      ],
    });
  });

  it('closes without a request when nothing changed', async () => {
    const update = vi.fn(() => Promise.resolve());
    const wrapper = await render(
      createInjector([...plainTheme.providers, featuresService({ update })]),
      'tenant-1',
    );

    const save = [...dialog().querySelectorAll('button')].find(
      button => button.textContent?.trim() === 'AbpUi::Save',
    );
    save?.click();
    await new Promise(resolve => setTimeout(resolve));

    expect(update).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:visible')?.at(-1)).toEqual([false]);
  });

  it('asks before resetting to the defaults', async () => {
    const remove = vi.fn(() => Promise.resolve());
    const injector = createInjector([
      ...plainTheme.providers,
      featuresService({ remove }),
      {
        provide: ConfirmationService,
        useValue: {
          warn: () => Promise.resolve(ConfirmationStatus.confirm),
        } as unknown as ConfirmationService,
      },
    ]);

    await render(injector, 'tenant-1');

    const reset = [...dialog().querySelectorAll('button')].find(
      button => button.textContent?.trim() === 'AbpFeatureManagement::ResetToDefault',
    );
    reset?.click();
    await new Promise(resolve => setTimeout(resolve));

    expect(remove).toHaveBeenCalledWith('T', 'tenant-1');
  });

  it('says so when the backend defines no features at all', async () => {
    await render(
      createInjector([...plainTheme.providers, featuresService({ answer: { groups: [] } })]),
    );

    expect(dialog().textContent).toContain('AbpFeatureManagement::NoFeatureFoundMessage');
    expect(
      [...dialog().querySelectorAll('button')].some(
        button => button.textContent?.trim() === 'AbpUi::Save',
      ),
    ).toBe(false);
  });
});
