import type { SortOrder } from '@lsw-abpvue/core';

/** One column of {@link AbpDataTable}. */
export interface AbpTableColumn<R = unknown> {
  /**
   * Identifies the column: the sort key sent to the backend, the name of the
   * `#cell-{id}` slot, and what a cell carries as `data-column`.
   */
  id: string;
  /** Already localized: the table does not know which resource a caller's texts are in. */
  header?: string | undefined;
  /** Reads the cell's value. Defaults to the row's field of the same name as the id. */
  value?: ((row: R, index: number) => unknown) | undefined;
  sortable?: boolean | undefined;
  /** In pixels, applied as a column width hint. */
  width?: number | undefined;
  headerClass?: string | undefined;
  cellClass?: string | undefined;
}

/** How a row is identified, for selection, expansion and rendering keys. */
export type AbpTableRecordKey<R = unknown> = string | ((row: R, index: number) => string);

export interface AbpTableSort {
  key: string;
  order: SortOrder;
}
