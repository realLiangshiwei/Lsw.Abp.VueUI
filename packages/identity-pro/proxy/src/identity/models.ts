import type {
  CreationAuditedEntityDto,
  EntityDto,
  ExtensibleEntityDto,
  ExtensibleFullAuditedEntityDto,
  ExtensibleObject,
  ExtensiblePagedAndSortedResultRequestDto,
  ExtensiblePagedResultRequestDto,
  PagedAndSortedResultRequestDto,
} from '@lsw-abpvue/core';
import type { IdentityClaimValueType } from './identity-claim-value-type.enum.js';
import type { ImportUsersFromFileType } from './import-users-from-file-type.enum.js';
import type { IdentityProPreventConcurrentLoginBehaviour } from './settings/identity-pro-prevent-concurrent-login-behaviour.enum.js';

export interface ClaimTypeDto extends ExtensibleEntityDto<string> {
  name?: string | undefined;
  required: boolean;
  isStatic: boolean;
  regex?: string | undefined;
  regexDescription?: string | undefined;
  description?: string | undefined;
  valueType: IdentityClaimValueType;
  valueTypeAsString?: string | undefined;
  concurrencyStamp?: string | undefined;
  creationTime: string;
}

export interface CreateClaimTypeDto extends ExtensibleObject {
  name: string;
  required?: boolean | undefined;
  regex?: string | undefined;
  regexDescription?: string | undefined;
  description?: string | undefined;
  valueType?: IdentityClaimValueType | undefined;
}

export interface DownloadTokenResultDto {
  token?: string | undefined;
}

export interface ExternalLoginProviderDto {
  name?: string | undefined;
  canObtainUserInfoWithoutPassword: boolean;
}

export interface GetAvailableRolesInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
  id?: string | undefined;
}

export interface GetAvailableUsersInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
  id?: string | undefined;
}

export interface GetIdentityClaimTypesInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface GetIdentityRoleListInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

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

export interface GetIdentitySessionListInput extends ExtensiblePagedAndSortedResultRequestDto {
  userId?: string | undefined;
  device?: string | undefined;
  clientId?: string | undefined;
}

export interface GetIdentityUserListAsFileInput extends GetIdentityUsersInput {
  token: string;
}

export interface GetIdentityUsersInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
  roleId?: string | null | undefined;
  organizationUnitId?: string | null | undefined;
  id?: string | null | undefined;
  userName?: string | undefined;
  phoneNumber?: string | undefined;
  emailAddress?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  isLockedOut?: boolean | null | undefined;
  notActive?: boolean | null | undefined;
  emailConfirmed?: boolean | null | undefined;
  isExternal?: boolean | null | undefined;
  maxCreationTime?: string | null | undefined;
  minCreationTime?: string | null | undefined;
  maxModifitionTime?: string | null | undefined;
  minModifitionTime?: string | null | undefined;
}

export interface GetImportInvalidUsersFileInput {
  token: string;
}

export interface GetImportUsersSampleFileInput {
  fileType?: ImportUsersFromFileType | undefined;
  token: string;
}

export interface GetMembersInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface GetOrganizationUnitInput extends ExtensiblePagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface IdentityLdapSettingsDto {
  enableLdapLogin?: boolean | undefined;
  ldaps?: boolean | undefined;
  ldapServerHost?: string | undefined;
  ldapServerPort?: string | undefined;
  ldapBaseDc?: string | undefined;
  ldapDomain?: string | undefined;
  ldapUserName?: string | undefined;
  ldapPassword?: string | undefined;
}

export interface IdentityLockoutSettingsDto {
  allowedForNewUsers?: boolean | undefined;
  lockoutDuration?: number | undefined;
  maxFailedAccessAttempts?: number | undefined;
}

export interface IdentityOAuthSettingsDto {
  enableOAuthLogin?: boolean | undefined;
  clientId: string;
  clientSecret?: string | undefined;
  authority: string;
  scope?: string | undefined;
  requireHttpsMetadata?: boolean | undefined;
  validateEndpoints?: boolean | undefined;
  validateIssuerName?: boolean | undefined;
}

export interface IdentityPasswordSettingsDto {
  requiredLength?: number | undefined;
  requiredUniqueChars?: number | undefined;
  requireNonAlphanumeric?: boolean | undefined;
  requireLowercase?: boolean | undefined;
  requireUppercase?: boolean | undefined;
  requireDigit?: boolean | undefined;
  forceUsersToPeriodicallyChangePassword?: boolean | undefined;
  passwordChangePeriodDays?: number | undefined;
  enablePreventPasswordReuse?: boolean | undefined;
  preventPasswordReuseCount?: number | undefined;
}

export interface IdentityRoleClaimDto {
  roleId?: string | undefined;
  claimType?: string | undefined;
  claimValue?: string | undefined;
}

export type IdentityRoleCreateDto = IdentityRoleCreateOrUpdateDtoBase;

export interface IdentityRoleCreateOrUpdateDtoBase extends ExtensibleObject {
  name: string;
  isDefault?: boolean | undefined;
  isPublic?: boolean | undefined;
}

export interface IdentityRoleDto extends ExtensibleEntityDto<string> {
  name?: string | undefined;
  isDefault: boolean;
  isStatic: boolean;
  isPublic: boolean;
  userCount: number;
  concurrencyStamp?: string | undefined;
  creationTime: string;
}

export interface IdentityRoleLookupDto extends EntityDto<string> {
  name?: string | undefined;
}

export interface IdentityRoleUpdateDto extends IdentityRoleCreateOrUpdateDtoBase {
  concurrencyStamp?: string | undefined;
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

export interface IdentitySessionSettingsDto {
  preventConcurrentLogin?: IdentityProPreventConcurrentLoginBehaviour | undefined;
}

export interface IdentitySettingsDto {
  password?: IdentityPasswordSettingsDto | undefined;
  lockout?: IdentityLockoutSettingsDto | undefined;
  signIn?: IdentitySignInSettingsDto | undefined;
  user?: IdentityUserSettingsDto | undefined;
}

export interface IdentitySignInSettingsDto {
  requireConfirmedEmail?: boolean | undefined;
  requireEmailVerificationToRegister?: boolean | undefined;
  enablePhoneNumberConfirmation?: boolean | undefined;
  requireConfirmedPhoneNumber?: boolean | undefined;
}

export interface IdentityUserClaimDto {
  userId?: string | undefined;
  claimType?: string | undefined;
  claimValue?: string | undefined;
}

export interface IdentityUserCreateDto extends IdentityUserCreateOrUpdateDtoBase {
  password: string;
  sendConfirmationEmail?: boolean | undefined;
  emailConfirmed?: boolean | undefined;
  phoneNumberConfirmed?: boolean | undefined;
}

export interface IdentityUserCreateOrUpdateDtoBase extends ExtensibleObject {
  userName: string;
  name?: string | undefined;
  surname?: string | undefined;
  email: string;
  phoneNumber?: string | undefined;
  isActive?: boolean | undefined;
  shouldChangePasswordOnNextLogin?: boolean | undefined;
  lockoutEnabled?: boolean | undefined;
  roleNames?: string[] | undefined;
  organizationUnitIds?: string[] | undefined;
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

export interface IdentityUserSettingsDto {
  isUserNameUpdateEnabled?: boolean | undefined;
  isEmailUpdateEnabled?: boolean | undefined;
}

export interface IdentityUserUpdateDto extends IdentityUserCreateOrUpdateDtoBase {
  emailConfirmed?: boolean | undefined;
  phoneNumberConfirmed?: boolean | undefined;
  concurrencyStamp?: string | undefined;
}

export interface IdentityUserUpdatePasswordInput {
  newPassword: string;
}

export interface IdentityUserUpdateRolesDto {
  roleNames: string[];
}

export interface ImportExternalUserInput {
  provider: string;
  userNameOrEmailAddress: string;
  password?: string | undefined;
}

export interface ImportUsersFromFileOutput {
  allCount: number;
  succeededCount: number;
  failedCount: number;
  invalidUsersDownloadToken?: string | undefined;
  isAllSucceeded: boolean;
}

export interface OrganizationUnitCreateDto extends OrganizationUnitCreateOrUpdateDtoBase {
  parentId?: string | null | undefined;
}

export interface OrganizationUnitCreateOrUpdateDtoBase extends ExtensibleObject {
  displayName: string;
}

export interface OrganizationUnitDto extends ExtensibleFullAuditedEntityDto<string> {
  parentId?: string | null | undefined;
  code?: string | undefined;
  displayName?: string | undefined;
  roles?: OrganizationUnitRoleDto[] | undefined;
}

export interface OrganizationUnitLookupDto extends EntityDto<string> {
  displayName?: string | undefined;
}

export interface OrganizationUnitMoveInput {
  newParentId?: string | null | undefined;
}

export interface OrganizationUnitRoleDto extends CreationAuditedEntityDto {
  organizationUnitId: string;
  roleId: string;
}

export interface OrganizationUnitRoleInput {
  roleIds?: string[] | undefined;
}

export interface OrganizationUnitUpdateDto extends OrganizationUnitCreateOrUpdateDtoBase {
  concurrencyStamp?: string | undefined;
}

export interface OrganizationUnitUserInput {
  userIds?: string[] | undefined;
}

export interface OrganizationUnitWithDetailsDto extends ExtensibleFullAuditedEntityDto<string> {
  parentId?: string | null | undefined;
  code?: string | undefined;
  displayName?: string | undefined;
  roles?: IdentityRoleDto[] | undefined;
  userCount: number;
  concurrencyStamp?: string | undefined;
}

export interface UpdateClaimTypeDto extends ExtensibleObject {
  name: string;
  required?: boolean | undefined;
  regex?: string | undefined;
  regexDescription?: string | undefined;
  description?: string | undefined;
  valueType?: IdentityClaimValueType | undefined;
  concurrencyStamp?: string | undefined;
}

export interface UserLookupCountInputDto {
  filter?: string | undefined;
}

export interface UserLookupSearchInputDto extends ExtensiblePagedResultRequestDto {
  sorting?: string | undefined;
  filter?: string | undefined;
}
