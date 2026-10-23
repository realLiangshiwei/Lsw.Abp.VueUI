import { defineToken } from '@lsw-abpvue/core';

/** Opens a fresh entity change detail in the current tenant. */
export type ShowEntityDetails = (entityChangeId: string) => void;
export const SHOW_ENTITY_DETAILS = defineToken<ShowEntityDetails>('SHOW_ENTITY_DETAILS');
