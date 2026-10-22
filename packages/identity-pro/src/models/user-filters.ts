import type { GetIdentityUsersInput } from '@lsw-abpvue/identity-pro/proxy';

export type IdentityUserAdvancedFilters = Omit<
  GetIdentityUsersInput,
  'filter' | 'sorting' | 'skipCount' | 'maxResultCount'
>;

export type IdentityUserDateFilter =
  'minCreationTime' | 'maxCreationTime' | 'minModifitionTime' | 'maxModifitionTime';

export interface IdentityUserDateRange {
  readonly from: string;
  readonly to: string;
}
