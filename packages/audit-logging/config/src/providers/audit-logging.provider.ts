import { inject, type ProviderInput } from '@lsw-abpvue/core';
import { EntityHistoryService } from '../services/entity-history.service.js';
import { SHOW_ENTITY_HISTORY } from '../tokens/entity-history.token.js';
/** Enables the shared entity history host and the optional module history actions. */
export function provideAuditLogging(): ProviderInput[] {
  return [{ provide: SHOW_ENTITY_HISTORY, useFactory: () => inject(EntityHistoryService).show }];
}
