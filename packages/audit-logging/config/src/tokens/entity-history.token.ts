import { defineToken } from '@lsw-abpvue/core';
/** Opens change history for an entity in the current tenant. */
export type ShowEntityHistory = (entityId: string, entityTypeFullName: string) => void;
export const SHOW_ENTITY_HISTORY = defineToken<ShowEntityHistory>('SHOW_ENTITY_HISTORY');
