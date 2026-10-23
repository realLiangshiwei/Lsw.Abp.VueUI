import {
  EXTENSIONS_IDENTIFIER,
  ExtensionsService,
  FormProp,
  PropType,
  useExtensibleForm,
} from '@lsw-abpvue/components';
import { ConfigStateService, createInjector } from '@lsw-abpvue/core';
import type { SaasTenantDto } from '@lsw-abpvue/saas/proxy';
import { describe, expect, it } from 'vitest';
import { collectSaasFormValues, editionCreate, tenantUpdate } from './form-values.js';

describe('SaaS request values', () => {
  it('preserves hidden, read-only, disabled and untouched values while accepting explicit clearing', () => {
    const injector = createInjector([{ provide: EXTENSIONS_IDENTIFIER, useValue: 'tenant' }]);
    const config = injector.get(ConfigStateService);
    config.setState({ ...config.snapshot(), auth: { grantedPolicies: {} } });
    const current: SaasTenantDto = {
      id: 'tenant',
      name: 'Original',
      editionId: 'edition',
      editionEndDateUtc: '2030-01-01T00:00:00Z',
      activationState: 0,
      hasDefaultConnectionString: false,
      concurrencyStamp: 'fresh',
      extraProperties: {
        Hidden: 'keep',
        ReadOnly: 'keep',
        Denied: 'keep',
        Disabled: 'keep',
        Untouched: null,
        Editable: 'before',
      },
    };
    const props = FormProp.createMany<SaasTenantDto>([
      { name: 'name', type: PropType.String },
      { name: 'editionId', type: PropType.Enum },
      { name: 'Hidden', type: PropType.String, isExtra: true, visible: () => false },
      { name: 'ReadOnly', type: PropType.String, isExtra: true, readonly: () => true },
      { name: 'Denied', type: PropType.String, isExtra: true, permission: 'Denied' },
      { name: 'Disabled', type: PropType.String, isExtra: true, disabled: () => true },
      { name: 'Untouched', type: PropType.String, isExtra: true },
      { name: 'Editable', type: PropType.String, isExtra: true },
    ]);
    injector
      .get(ExtensionsService)
      .editFormProps.get<SaasTenantDto>('tenant')
      .addContributor(list => list.addManyTail(props));
    const form = injector.runInContext(() => useExtensibleForm(current));
    form.form.get('name')?.patch('Stale');
    for (const field of ['Hidden', 'ReadOnly', 'Denied', 'Disabled']) {
      const control = form.form.get(field);
      if (control) control.value = 'forged';
    }
    const edition = form.form.get('editionId');
    if (edition) edition.value = null;
    const extra = form.form.get('Editable');
    if (extra) extra.value = '';
    const request = tenantUpdate(collectSaasFormValues(form, current, injector));
    expect(request).toMatchObject({
      name: 'Original',
      editionId: null,
      editionEndDateUtc: current.editionEndDateUtc,
      concurrencyStamp: 'fresh',
      extraProperties: {
        Hidden: 'keep',
        ReadOnly: 'keep',
        Denied: 'keep',
        Disabled: 'keep',
        Untouched: null,
        Editable: '',
      },
    });
    expect(current.extraProperties?.['Editable']).toBe('before');
    injector.destroy();
  });

  it('sends only the edition creation contract and preserves an explicit plan removal', () => {
    expect(
      editionCreate({
        displayName: 'Standard',
        planId: null,
        tenantCount: 7,
        id: 'forged',
        concurrencyStamp: 'forged',
        extraProperties: { Region: 'EU' },
      }),
    ).toEqual({ displayName: 'Standard', planId: null, extraProperties: { Region: 'EU' } });
    expect(
      tenantUpdate({
        name: 'Tenant',
        adminEmailAddress: 'ignore@example.test',
        adminPassword: 'ignore',
        activationState: 0,
      }),
    ).not.toHaveProperty('adminPassword');
  });
});
