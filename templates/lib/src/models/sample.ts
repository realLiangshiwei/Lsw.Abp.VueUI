import type { ExtensibleAuditedEntityDto } from '@lsw-abpvue/core';

/**
 * The record the page lists. Replace this file with what `abpv proxy add` generates
 * against your own backend -- it writes the real DTOs and a typed service for them.
 */
export interface SampleDto extends ExtensibleAuditedEntityDto<string> {
  name?: string | undefined;
}
