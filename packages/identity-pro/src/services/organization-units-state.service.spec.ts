import { createInjector } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { OrganizationUnitsStateService } from './organization-units-state.service.js';
describe('organization unit selection state', () => {
  it('exposes a reactive selection that can be refreshed and removed', () => {
    const injector = createInjector([]);
    const service = injector.get(OrganizationUnitsStateService);
    const selected = service.getSelectedNode();
    expect(selected.value).toBeUndefined();
    const unit = { id: 'unit', displayName: 'Unit', userCount: 0 };
    service.setSelectedUnit(unit);
    expect(selected.value).toBe(unit);
    expect(service.state.value.selectedUnit).toBe(unit);
    service.refreshSelectedNode();
    expect(selected.value).toEqual(unit);
    expect(selected.value).not.toBe(unit);
    service.removeSelectedNode();
    service.refreshSelectedNode();
    expect(selected.value).toBeUndefined();
    injector.destroy();
  });
  it('isolates selection between application injectors', () => {
    const first = createInjector([]);
    const second = createInjector([]);
    first.get(OrganizationUnitsStateService).setSelectedUnit({ id: 'first', userCount: 0 });
    expect(second.get(OrganizationUnitsStateService).getSelectedNode().value).toBeUndefined();
    first.destroy();
    second.destroy();
  });
});
