import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import {
  ABP_INJECTOR_KEY,
  createInjector,
  ConfigStateService,
  LocalizationService,
  RestService,
  provideAbpCore,
  withLocalizations,
  withOptions,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { provideThemeBasicComponents } from '@lsw-abpvue/theme-basic';
import { AbpSelect, ConfirmationService, ConfirmationStatus } from '@lsw-abpvue/theme-shared';
import ButtonExample from './ButtonExample.vue';
import GridActionsExample from './GridActionsExample.vue';
import PaginationExample from './PaginationExample.vue';
import TableExample from './TableExample.vue';
import ValidationExample from './ValidationExample.vue';
import ListExample from './ListExample.vue';
import { formatCalendarDate, formatInstant } from './date-display';

let wrapper: VueWrapper | undefined;
let injector: Injector | undefined;
afterEach(() => {
  wrapper?.unmount();
  injector?.destroy();
  vi.useRealTimers();
});
function render(component: Component, providers: ProviderInput[] = []): VueWrapper {
  injector = createInjector([
    provideAbpCore(
      withOptions({
        environment: {
          production: false,
          application: { name: 'Examples' },
          apis: { default: { url: '' } },
        },
      }),
      withLocalizations([
        {
          culture: 'en',
          resources: [
            { resourceName: 'BookStore', texts: { Books: 'Books' } },
            {
              resourceName: 'AbpUi',
              texts: {
                'PagerInfo{0}{1}{2}': 'Showing {0} to {1} of {2} entries',
                SelectAll: 'Select all',
                SelectRow: 'Select row',
                Actions: 'Actions',
                PagerSize: 'Page size',
                PagerPrevious: 'Previous',
                PagerNext: 'Next',
                LoadingWithThreeDot: 'Loading…',
              },
            },
          ],
        },
      ]),
    ),
    provideThemeBasicComponents(),
    ...providers,
  ]);
  const config = injector.get(ConfigStateService);
  const state = config.snapshot();
  config.setState({
    ...state,
    localization: {
      ...state.localization,
      currentCulture: { ...state.localization.currentCulture, cultureName: 'en' },
    },
  });
  const localization = injector.get(LocalizationService);
  wrapper = mount(component, {
    global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: localization.t } },
  });
  return wrapper;
}
describe('documentation interaction examples', () => {
  it('combines extra filters and resets all conditions from a later page', async () => {
    const request = vi.fn(async (query: { params?: Record<string, unknown> }) => ({
      items: [],
      totalCount: query.params?.category ? 12 : 30,
    }));
    const view = render(ListExample, [{ provide: RestService, useValue: { request } }]);
    await flushPromises();
    view.findComponent(AbpSelect).vm.$emit('update:modelValue', 'reference');
    await view.get('input[type="number"]').setValue(20);
    await flushPromises();
    expect(request.mock.lastCall?.[0]).toMatchObject({
      params: { category: 'reference', minPrice: 20, skipCount: 0 },
    });
    await view
      .findAll('button')
      .find(button => button.text() === '2')
      ?.trigger('click');
    await flushPromises();
    expect(request.mock.lastCall?.[0]).toMatchObject({ params: { skipCount: 10 } });
    await view
      .findAll('button')
      .find(button => button.text() === 'Reset filters')
      ?.trigger('click');
    await flushPromises();
    expect(request.mock.lastCall?.[0]).toMatchObject({
      params: { filter: undefined, category: undefined, minPrice: undefined, skipCount: 0 },
    });
  });

  it('keeps previous rows on failure and retries the same query', async () => {
    const request = vi.fn(async () => ({
      items: [{ id: '1', name: '1984', category: 'fiction', price: 10 }],
      totalCount: 1,
    }));
    const view = render(ListExample, [{ provide: RestService, useValue: { request } }]);
    await flushPromises();
    request.mockRejectedValueOnce(new Error('The query failed'));
    await view
      .findAll('button')
      .find(button => button.text() === 'Refresh current page')
      ?.trigger('click');
    await flushPromises();
    expect(view.get('tbody').text()).toContain('1984');
    expect(view.get('[role="alert"]').text()).toContain('The query failed');
    await view
      .findAll('button')
      .find(button => button.text() === 'Retry')
      ?.trigger('click');
    await flushPromises();
    expect(view.find('[role="alert"]').exists()).toBe(false);
    expect(view.get('tbody').text()).toContain('1984');
  });

  it('returns to a valid page after deleting the last row on a later page', async () => {
    let deleted = false;
    const request = vi.fn(async (query: { method: string; params?: Record<string, unknown> }) => {
      if (query.method === 'DELETE') deleted = true;
      return {
        items: [{ id: 'last', name: 'Last book', category: 'fiction', price: 10 }],
        totalCount: deleted ? 10 : 11,
      };
    });
    const view = render(ListExample, [
      { provide: RestService, useValue: { request } },
      { provide: ConfirmationService, useValue: { warn: async () => ConfirmationStatus.confirm } },
    ]);
    await flushPromises();
    await view
      .findAll('button')
      .find(button => button.text() === '2')
      ?.trigger('click');
    await flushPromises();
    expect(request.mock.lastCall?.[0]).toMatchObject({ params: { skipCount: 10 } });
    await view.get('tbody summary').trigger('click');
    await view
      .findAll('tbody button')
      .find(button => button.text() === 'Delete')
      ?.trigger('click');
    await flushPromises();
    expect(request.mock.calls.some(([query]) => query.method === 'DELETE')).toBe(true);
    expect(request.mock.lastCall?.[0]).toMatchObject({ params: { skipCount: 0 } });
    expect(view.text()).toContain('Showing 1 to 10 of 10 entries');
  });

  it('returns to the first server page when sorting changes', async () => {
    const request = vi.fn(async (query: { params?: Record<string, unknown> }) => ({
      items: [{ id: '1', name: '1984', category: 'fiction', price: 10 }],
      totalCount: query.params?.filter ? 1 : 30,
    }));
    const view = render(ListExample, [{ provide: RestService, useValue: { request } }]);
    await flushPromises();
    await view
      .findAll('button')
      .find(button => button.text() === '2')
      ?.trigger('click');
    await flushPromises();
    expect(request.mock.lastCall?.[0]).toMatchObject({ params: { skipCount: 10 } });
    await view.get('th button').trigger('click');
    await flushPromises();
    expect(request.mock.lastCall?.[0]).toMatchObject({ params: { skipCount: 0 } });
  });
  it('disables saving until the local operation finishes', async () => {
    vi.useFakeTimers();
    const view = render(ButtonExample);
    await view.get('button').trigger('click');
    expect(view.get('button').attributes('disabled')).toBeDefined();
    await vi.advanceTimersByTimeAsync(800);
    expect(view.get('output').text()).toContain('Completed saves: 1');
    expect(view.get('button').attributes('disabled')).toBeUndefined();
  });
  it('shows a menu for several actions and one button for one action', () => {
    const view = render(GridActionsExample);
    expect(view.findAll('summary')).toHaveLength(1);
    expect(view.findAll('button').filter(button => button.text() === 'Edit')).toHaveLength(2);
  });
  it('keeps the request offset aligned with the visible page', async () => {
    const view = render(PaginationExample);
    const page = view.findAll('button').find(button => button.text() === '2');
    expect(page).toBeDefined();
    await page?.trigger('click');
    expect(view.get('output').text()).toContain('API skipCount: 5');
    expect(view.text()).toContain('Showing 6 to 10 of 47 entries');
  });
  it('restores the original local order after the third sort click', async () => {
    const view = render(TableExample);
    const price = view.findAll('th button').find(button => button.text() === 'Price');
    expect(price).toBeDefined();
    await price?.trigger('click');
    await price?.trigger('click');
    await price?.trigger('click');
    expect(view.findAll('tbody tr')[0]?.text()).toContain('Pride and Prejudice');
  });
  it('renders a required error and clears it after correction', async () => {
    const view = render(ValidationExample);
    await view.get('form').trigger('submit');
    expect(view.text()).toContain('Email is required');
    await view.get('input').setValue('reader@example.com');
    await view.get('form').trigger('submit');
    expect(view.text()).not.toContain('Email is required');
    expect(view.get('output').text()).toContain('submitted: true');
  });
  it('formats calendar dates independently of local timezone conversion', () => {
    expect(formatCalendarDate('2026-10-04', 'en-US')).toBe('Oct 4, 2026');
    expect(formatInstant('invalid', 'en-US', 'UTC')).toBe('—');
  });
});
