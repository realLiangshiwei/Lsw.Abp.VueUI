import {
  ABP_INJECTOR_KEY,
  createInjector,
  LocalizationService,
  type Injector,
  type LocalizationParam,
} from '@lsw-abpvue/core';
import { IdentityUserService } from '@lsw-abpvue/identity-pro/proxy';
import { plainTheme } from '@lsw-abpvue/theme-shared/testing';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IdentityUserAdvancedFilters } from '../models/user-filters.js';
import UserAdvancedFilters from './UserAdvancedFilters.vue';

const mounted: VueWrapper[] = [];
const injectors: Injector[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  for (const injector of injectors.splice(0)) injector.destroy();
  document.body.innerHTML = '';
});

function api() {
  return {
    getRoleLookup: vi.fn(() =>
      Promise.resolve([
        { id: 'role-reader', name: 'Readers' },
        { id: 'role-admin', name: 'Administrators' },
      ]),
    ),
    getOrganizationUnitLookup: vi.fn(() =>
      Promise.resolve([{ id: 'unit-development', displayName: 'Development' }]),
    ),
  };
}
function render(modelValue: IdentityUserAdvancedFilters = { notActive: false }, service = api()) {
  const injector = createInjector([
    ...plainTheme.providers,
    { provide: IdentityUserService, useValue: service },
    {
      provide: LocalizationService,
      useValue: {
        t: (key: LocalizationParam) => (typeof key === 'string' ? key : key.defaultValue),
      },
    },
  ]);
  const wrapper = mount(UserAdvancedFilters, {
    attachTo: document.body,
    props: { modelValue, contextKey: 'host' },
    global: { provide: { [ABP_INJECTOR_KEY]: injector }, mocks: { $t: (key: string) => key } },
  });
  mounted.push(wrapper);
  injectors.push(injector);
  return { wrapper, service };
}
async function expand(wrapper: VueWrapper) {
  await wrapper.get('button[aria-controls]').trigger('click');
  await flushPromises();
}
function button(wrapper: VueWrapper, label: string) {
  const found = wrapper.findAll('button').find(value => value.text() === label);
  if (!found) throw new Error(`The ${label} button is unavailable.`);
  return found;
}

describe('commercial advanced user filters', () => {
  it('starts collapsed and exposes every advanced field after expansion', async () => {
    const { wrapper, service } = render();
    expect(wrapper.get('button[aria-controls]').attributes('aria-expanded')).toBe('false');
    expect(service.getRoleLookup).not.toHaveBeenCalled();
    await expand(wrapper);
    expect(wrapper.get('button[aria-controls]').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('form').isVisible()).toBe(true);
    for (const name of [
      'roleId',
      'organizationUnitId',
      'id',
      'userName',
      'name',
      'surname',
      'phoneNumber',
      'emailAddress',
      'notActive',
      'emailConfirmed',
      'isLockedOut',
      'isExternal',
      'minCreationTime',
      'maxCreationTime',
      'minModifitionTime',
      'maxModifitionTime',
    ]) {
      expect(wrapper.find(`[name="${name}"]`).exists(), name).toBe(true);
    }
    await expand(wrapper);
    expect(wrapper.find('form').exists()).toBe(false);
    expect(service.getRoleLookup).toHaveBeenCalledTimes(1);
  });

  it('keeps edits as drafts until form submission and preserves false flags', async () => {
    const { wrapper } = render();
    await expand(wrapper);
    await wrapper.get('input[name="userName"]').setValue('Exact User');
    await wrapper.get('select[name="emailConfirmed"]').setValue('false');
    await wrapper.get('select[name="notActive"]').setValue('true');
    expect(wrapper.emitted('apply')).toBeUndefined();
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')?.[0]).toEqual([
      { userName: 'Exact User', notActive: true, emailConfirmed: false },
    ]);
    expect(wrapper.emitted('update:modelValue')).toEqual(wrapper.emitted('apply'));
  });

  it('preserves a draft and complete lookup options while the panel is collapsed', async () => {
    const { wrapper, service } = render();
    await expand(wrapper);
    await wrapper.get('input[name="userName"]').setValue('Unsaved draft');
    await expand(wrapper);
    expect(wrapper.find('input[name="userName"]').exists()).toBe(false);
    await expand(wrapper);
    expect(wrapper.get<HTMLInputElement>('input[name="userName"]').element.value).toBe(
      'Unsaved draft',
    );
    expect(wrapper.get('select[name="roleId"]').text()).toContain('Readers');
    expect(service.getRoleLookup).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('apply')).toBeUndefined();
  });

  it('clears to active users without submitting or losing the current applied query', async () => {
    const current = {
      userName: 'Applied',
      roleId: 'role-reader',
      isExternal: false,
      notActive: true,
    };
    const { wrapper } = render(current);
    await expand(wrapper);
    await button(wrapper, 'AbpUi::Clear').trigger('click');
    expect(wrapper.get<HTMLInputElement>('input[name="userName"]').element.value).toBe('');
    expect(wrapper.get<HTMLSelectElement>('select[name="notActive"]').element.value).toBe('false');
    expect(wrapper.emitted('apply')).toBeUndefined();
    expect(current).toEqual({
      userName: 'Applied',
      roleId: 'role-reader',
      isExternal: false,
      notActive: true,
    });
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')?.[0]).toEqual([{ notActive: false }]);
  });

  it('supports the all value independently from boolean false', async () => {
    const { wrapper } = render({ notActive: false, isExternal: false });
    await expand(wrapper);
    await wrapper.get('select[name="notActive"]').setValue('null');
    await wrapper.get('select[name="isExternal"]').setValue('false');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')?.[0]).toEqual([{ isExternal: false }]);
  });

  it('searches all lookup options locally and retains the selected role', async () => {
    const { wrapper, service } = render({ roleId: 'role-admin', notActive: false });
    await expand(wrapper);
    await wrapper.get('input[name="roleIdSearch"]').setValue('Read');
    expect(wrapper.get('select[name="roleId"]').text()).toContain('Readers');
    expect(wrapper.get('select[name="roleId"]').text()).toContain('Administrators');
    await wrapper.get('select[name="roleId"]').setValue('role-reader');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')?.[0]).toEqual([{ roleId: 'role-reader', notActive: false }]);
    expect(service.getRoleLookup).toHaveBeenCalledTimes(1);
  });

  it('prevents reversed date ranges and allows independent bounds after correction', async () => {
    const { wrapper } = render();
    await expand(wrapper);
    await wrapper.get('input[name="minCreationTime"]').setValue('2026-10-02');
    await wrapper.get('input[name="maxCreationTime"]').setValue('2026-10-01');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')).toBeUndefined();
    expect(wrapper.text()).toContain('AbpValidation::ThisFieldIsNotValid.');
    await wrapper.get('input[name="maxCreationTime"]').setValue('');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')?.[0]).toEqual([
      { notActive: false, minCreationTime: '2026-10-02' },
    ]);
  });

  it('preserves extension filters when standard controls are applied', async () => {
    const { wrapper } = render({
      notActive: false,
      extraProperties: { Department: 'QA', Enabled: false },
    });
    await expand(wrapper);
    await wrapper.get('input[name="surname"]').setValue('Updated');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')?.[0]).toEqual([
      {
        surname: 'Updated',
        notActive: false,
        extraProperties: { Department: 'QA', Enabled: false },
      },
    ]);
  });

  it('sets and clears one date range without submitting or clearing other filters', async () => {
    const { wrapper } = render({
      notActive: false,
      userName: 'Preserved',
      minModifitionTime: '2026-10-01',
    });
    await expand(wrapper);
    await wrapper
      .get('button[aria-label="AbpIdentity::CreationDate AbpUi::Today"]')
      .trigger('click');
    expect(wrapper.get<HTMLInputElement>('input[name="minCreationTime"]').element.value).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(wrapper.get<HTMLInputElement>('input[name="maxCreationTime"]').element.value).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(wrapper.emitted('apply')).toBeUndefined();
    await wrapper
      .get('button[aria-label="AbpIdentity::CreationDate AbpUi::Clear"]')
      .trigger('click');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('apply')?.[0]).toEqual([
      { notActive: false, userName: 'Preserved', minModifitionTime: '2026-10-01' },
    ]);
  });

  it('shows lookup failure and retries without pretending there are no roles', async () => {
    const service = api();
    service.getRoleLookup.mockRejectedValueOnce(new Error('Lookup unavailable'));
    const { wrapper } = render(undefined, service);
    await expand(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain('AbpUi::ErrorLoadingDatatable');
    expect(wrapper.text()).not.toContain('Lookup unavailable');
    expect(wrapper.get('select[name="roleId"]').attributes('disabled')).toBeDefined();
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.get('select[name="roleId"]').text()).toContain('Readers');
  });

  it('clears old-context lookup state and reloads only after reopening', async () => {
    const { wrapper, service } = render();
    await expand(wrapper);
    await wrapper.get('input[name="userName"]').setValue('Old tenant');
    await wrapper.setProps({ contextKey: 'tenant-a', modelValue: { notActive: false } });
    expect(wrapper.get('button[aria-controls]').attributes('aria-expanded')).toBe('false');
    expect(wrapper.find('input[name="userName"]').exists()).toBe(false);
    expect(wrapper.find('select[name="roleId"]').exists()).toBe(false);
    await expand(wrapper);
    expect(wrapper.get<HTMLInputElement>('input[name="userName"]').element.value).toBe('');
    expect(service.getRoleLookup).toHaveBeenCalledTimes(2);
  });
});
