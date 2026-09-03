export interface AbpPaginationProps {
  /** Zero-based, so it binds straight to `ListService.page`. */
  page: number;
  pageSize: number;
  total: number;
  /** Page links either side of the current one before the ellipsis. */
  siblingCount?: number | undefined;
  showSizeSelector?: boolean | undefined;
  pageSizes?: readonly number[] | undefined;
  disabled?: boolean | undefined;
  /** Accessible name of the navigation landmark. */
  ariaLabel?: string | undefined;
}

export interface AbpPaginationEmits {
  'update:page': [value: number];
  'update:pageSize': [value: number];
}
