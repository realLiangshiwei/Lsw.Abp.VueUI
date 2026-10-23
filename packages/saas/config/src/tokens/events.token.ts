import { defineEvent } from '@lsw-abpvue/core';
import type { SaasEditionsChanged, SaasTenantsChanged } from '../models/events.js';

/** Query invalidations confirmed by SaaS writes in the publishing application. */
export const SaasEvents = {
  TenantsChanged: defineEvent<SaasTenantsChanged>('Saas.TenantsChanged'),
  EditionsChanged: defineEvent<SaasEditionsChanged>('Saas.EditionsChanged'),
} as const;
