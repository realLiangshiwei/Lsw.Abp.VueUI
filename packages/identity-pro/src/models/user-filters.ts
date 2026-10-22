export interface IdentityUserAdvancedFilters {
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
  extraProperties?: Record<string, unknown> | undefined;
}

export type IdentityUserDateFilter =
  'minCreationTime' | 'maxCreationTime' | 'minModifitionTime' | 'maxModifitionTime';

export interface IdentityUserDateRange {
  readonly from: string;
  readonly to: string;
}
