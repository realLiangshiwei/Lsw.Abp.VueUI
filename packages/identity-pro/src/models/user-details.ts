import type {
  IdentityUserDto,
  OrganizationUnitDto,
  OrganizationUnitWithDetailsDto,
} from '@lsw-abpvue/identity-pro/proxy';
import type { ComputedRef } from 'vue';

export interface IdentityUserDetailsSnapshot {
  readonly user: IdentityUserDto;
  readonly creator: IdentityUserDto | undefined;
  readonly modifier: IdentityUserDto | undefined;
  readonly assignedOrganizationUnits: readonly OrganizationUnitDto[];
  readonly availableOrganizationUnits: readonly OrganizationUnitWithDetailsDto[];
}

export type IdentityUserDetailsLoadState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly userId: string }
  | { readonly status: 'ready'; readonly snapshot: IdentityUserDetailsSnapshot }
  | { readonly status: 'error'; readonly error: unknown };

export interface IdentityUserDetailsLoader {
  readonly state: ComputedRef<IdentityUserDetailsLoadState>;
  load(userId: string): Promise<IdentityUserDetailsSnapshot | undefined>;
  reset(): void;
}

export type IdentityUserDetailsOrganizationUnit = Pick<
  OrganizationUnitWithDetailsDto,
  'parentId' | 'displayName'
> & { readonly id: NonNullable<OrganizationUnitWithDetailsDto['id']> };
