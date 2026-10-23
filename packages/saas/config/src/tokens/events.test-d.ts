import { EventBusService, createInjector, type EventToken } from '@lsw-abpvue/core';
import { expectTypeOf, test } from 'vitest';
import { SaasEvents, type SaasEditionsChanged, type SaasTenantsChanged } from '../index.js';

test('exports typed SaaS contracts independently of the page implementation', () => {
  expectTypeOf(SaasEvents.TenantsChanged).toEqualTypeOf<EventToken<SaasTenantsChanged>>();
  expectTypeOf(SaasEvents.EditionsChanged).toEqualTypeOf<EventToken<SaasEditionsChanged>>();
  const bus = createInjector([]).get(EventBusService);
  const context = { userId: 'host-user', tenantId: null };
  bus.emit(SaasEvents.TenantsChanged, { context, reason: 'editionChanged' });
  bus.emit(SaasEvents.EditionsChanged, { context, reason: 'deleted', editionId: 'edition-1' });
  // @ts-expect-error The target tenant IDs cannot replace the publishing context.
  bus.emit(SaasEvents.TenantsChanged, { reason: 'updated', tenantIds: ['tenant-1'] });
  // @ts-expect-error The edition contract does not describe tenant reassignment.
  bus.emit(SaasEvents.EditionsChanged, { context, reason: 'editionChanged' });
});
