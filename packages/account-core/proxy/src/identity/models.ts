import type { ExtensibleFullAuditedEntityDto } from '@lsw-abpvue/core';

export interface IdentityUserDto extends ExtensibleFullAuditedEntityDto<string> {
  tenantId?: string | null | undefined;
  userName?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  email?: string | undefined;
  emailConfirmed: boolean;
  phoneNumber?: string | undefined;
  phoneNumberConfirmed: boolean;
  isActive: boolean;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  lockoutEnd?: string | null | undefined;
  concurrencyStamp?: string | undefined;
  entityVersion: number;
  lastPasswordChangeTime?: string | null | undefined;
}
