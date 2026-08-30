/** What ABP's list endpoints accept. */
export interface PageQueryParams {
  filter?: string | undefined;
  /** `name asc` — the property and direction, as the backend expects it. */
  sorting?: string | undefined;
  skipCount?: number | undefined;
  maxResultCount?: number | undefined;
}

export interface ListResultDto<T> {
  items: T[];
}

export interface PagedResultDto<T> extends ListResultDto<T> {
  totalCount: number;
}

export type SortOrder = 'asc' | 'desc' | '';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
