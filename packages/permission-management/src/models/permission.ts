import type {
  PermissionGrantInfoDto,
  PermissionGroupDto,
} from '@lsw-abpvue/permission-management/proxy';

/** A permission with the group it came from, which is what the tab counts are of. */
export interface GroupedPermission extends PermissionGrantInfoDto {
  groupName: string;
  /** How many parents it has, for the indent that shows the hierarchy. */
  depth: number;
}

/** What a "select all" checkbox is: on, off, or partly on. */
export interface CheckboxState {
  checked: boolean;
  indeterminate: boolean;
}

export type PermissionGroups = readonly PermissionGroupDto[];
