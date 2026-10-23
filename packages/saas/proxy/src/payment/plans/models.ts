import type { ExtensibleEntityDto } from '@lsw-abpvue/core';

export interface PlanDto extends ExtensibleEntityDto<string> {
  name?: string | undefined;
  concurrencyStamp?: string | undefined;
}
