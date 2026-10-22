import type {
  EntityDto,
  ExtensibleEntityDto,
  ExtensibleFullAuditedEntityDto,
  ExtensiblePagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';

export interface GetIdentitySecurityLogListInput extends ExtensiblePagedAndSortedResultRequestDto {
  startTime?: string | null | undefined;
  endTime?: string | null | undefined;
  applicationName?: string | undefined;
  identity?: string | undefined;
  action?: string | undefined;
  userName?: string | undefined;
  clientId?: string | undefined;
  correlationId?: string | undefined;
  clientIpAddress?: string | undefined;
}

export interface IdentitySecurityLogDto extends EntityDto<string> {
  tenantId?: string | null | undefined;
  applicationName?: string | undefined;
  identity?: string | undefined;
  action?: string | undefined;
  userId?: string | null | undefined;
  userName?: string | undefined;
  tenantName?: string | undefined;
  clientId?: string | undefined;
  correlationId?: string | undefined;
  clientIpAddress?: string | undefined;
  browserInfo?: string | undefined;
  creationTime: string;
  extraProperties?: Record<string, unknown> | undefined;
}

export interface IdentitySessionDto extends ExtensibleEntityDto<string> {
  sessionId?: string | undefined;
  isCurrent: boolean;
  device?: string | undefined;
  deviceInfo?: string | undefined;
  tenantId?: string | null | undefined;
  tenantName?: string | undefined;
  userId: string;
  userName?: string | undefined;
  clientId?: string | undefined;
  ipAddresses?: string[] | undefined;
  signedIn: string;
  lastAccessed?: string | null | undefined;
}

export interface IdentityUserDto extends ExtensibleFullAuditedEntityDto<string> {
  tenantId?: string | null | undefined;
  userName?: string | undefined;
  email?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  emailConfirmed: boolean;
  phoneNumber?: string | undefined;
  phoneNumberConfirmed: boolean;
  supportTwoFactor: boolean;
  twoFactorEnabled: boolean;
  isActive: boolean;
  lockoutEnabled: boolean;
  isLockedOut: boolean;
  lockoutEnd?: string | null | undefined;
  shouldChangePasswordOnNextLogin: boolean;
  concurrencyStamp?: string | undefined;
  roleNames?: string[] | undefined;
  accessFailedCount: number;
  lastPasswordChangeTime?: string | null | undefined;
  isExternal: boolean;
}
