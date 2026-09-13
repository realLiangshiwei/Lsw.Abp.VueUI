export { default as AbpPermissionManagement } from './components/AbpPermissionManagement.vue';

export { PermissionManagementComponents } from './enums/components.js';
export type { PermissionManagementComponent } from './enums/components.js';

export type { CheckboxState, GroupedPermission, PermissionGroups } from './models/permission.js';

export {
  changesBetween,
  checkboxState,
  flatten,
  INDENT_STEP,
  isGrantedElsewhere,
  isSelectAllDisabled,
  matchingGroups,
  setMany,
  toggle,
} from './utils/permissions.js';
