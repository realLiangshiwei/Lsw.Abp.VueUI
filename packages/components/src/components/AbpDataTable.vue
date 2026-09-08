<script setup lang="ts" generic="R">
import type { SortOrder } from '@lsw-abpvue/core';
import { AbpSpinner, AbpToggle } from '@lsw-abpvue/theme-shared';
import { getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table';
import { computed } from 'vue';
import type { AbpTableColumn, AbpTableRecordKey } from '../models/table.js';
import { EMPTY_TEXT, EXPAND_ROW, LOADING, SELECT_ALL, SELECT_ROW } from '../defaults/texts.js';

const props = withDefaults(
  defineProps<{
    columns: readonly AbpTableColumn<R>[];
    data: readonly R[];
    /** How a row is identified; the index is used when there is nothing to identify it by. */
    recordKey?: AbpTableRecordKey<R> | undefined;
    /** Names the table for a screen reader. Already localized. */
    caption?: string | undefined;
    selectable?: boolean | undefined;
    expandable?: boolean | undefined;
    loading?: boolean | undefined;
    /** Shown instead of the rows when there are none. Already localized. */
    emptyText?: string | undefined;
  }>(),
  {
    recordKey: undefined,
    caption: undefined,
    emptyText: undefined,
    selectable: false,
    expandable: false,
    loading: false,
  },
);

/** The column the backend is sorting by, so it binds to `ListService.sortKey`. */
const sortKey = defineModel<string>('sortKey', { default: '' });
const sortOrder = defineModel<SortOrder>('sortOrder', { default: '' });
/** The keys of the selected rows, and of the expanded ones. */
const selected = defineModel<string[]>('selected', { default: () => [] });
const expanded = defineModel<string[]>('expanded', { default: () => [] });

defineSlots<
  {
    toolbar?: () => unknown;
    'expanded-row'?: (props: { row: R; index: number }) => unknown;
    empty?: () => unknown;
  } & {
    [name: `cell-${string}`]: (props: { row: R; value: unknown; index: number }) => unknown;
  }
>();

const keyOf = (row: R, index: number): string => {
  const recordKey = props.recordKey;
  if (typeof recordKey === 'function') return recordKey(row, index);
  if (recordKey) return String((row as Record<string, unknown>)[recordKey] ?? index);

  return String(index);
};

const definitions = computed<ColumnDef<R>[]>(() =>
  props.columns.map(column => ({
    id: column.id,
    accessorFn: (row, index) =>
      column.value
        ? column.value(row, index)
        : ((row as Record<string, unknown>)[column.id] ?? null),
  })),
);

const table = useVueTable<R>({
  get data() {
    return props.data as R[];
  },
  get columns() {
    return definitions.value;
  },
  getRowId: keyOf,
  getCoreRowModel: getCoreRowModel(),
  // The backend pages and sorts; the table only says what was asked for.
  manualSorting: true,
  manualPagination: true,
});

const rows = computed(() => table.getRowModel().rows);

const columnCount = computed(
  () => props.columns.length + (props.selectable ? 1 : 0) + (props.expandable ? 1 : 0),
);

const allSelected = computed(
  () => rows.value.length > 0 && rows.value.every(row => selected.value.includes(row.id)),
);

const someSelected = computed(
  () => !allSelected.value && rows.value.some(row => selected.value.includes(row.id)),
);

/** Ascending, then descending, then not sorted at all -- and back to the first page. */
function toggleSort(column: AbpTableColumn<R>): void {
  if (sortKey.value !== column.id) {
    sortKey.value = column.id;
    sortOrder.value = 'asc';
    return;
  }

  const next: SortOrder =
    sortOrder.value === 'asc' ? 'desc' : sortOrder.value === 'desc' ? '' : 'asc';
  sortOrder.value = next;
  if (!next) sortKey.value = '';
}

function ariaSortOf(column: AbpTableColumn<R>): 'ascending' | 'descending' | 'none' | undefined {
  if (!column.sortable) return undefined;
  if (sortKey.value !== column.id || !sortOrder.value) return 'none';

  return sortOrder.value === 'asc' ? 'ascending' : 'descending';
}

function toggleSelected(key: string, checked: boolean): void {
  selected.value = checked
    ? [...selected.value, key]
    : selected.value.filter(entry => entry !== key);
}

function toggleAll(checked: boolean): void {
  const keys = rows.value.map(row => row.id);
  selected.value = checked
    ? [...selected.value, ...keys.filter(key => !selected.value.includes(key))]
    : selected.value.filter(key => !keys.includes(key));
}

function toggleExpanded(key: string): void {
  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter(entry => entry !== key)
    : [...expanded.value, key];
}
</script>

<template>
  <div class="abp-table-wrapper">
    <div v-if="$slots.toolbar" class="abp-table-toolbar">
      <slot name="toolbar" />
    </div>

    <div class="abp-table-scroll">
      <table class="abp-table">
        <caption v-if="caption" class="abp-table-caption">
          {{
            caption
          }}
        </caption>

        <thead class="abp-table-head">
          <tr>
            <th v-if="selectable" scope="col" class="abp-table-select">
              <AbpToggle
                variant="checkbox"
                :model-value="allSelected"
                :indeterminate="someSelected"
                :aria-label="$t(SELECT_ALL)"
                @update:model-value="toggleAll(Boolean($event))"
              />
            </th>
            <th v-if="expandable" scope="col" class="abp-table-expand">
              <span class="abp-visually-hidden">{{ $t(EXPAND_ROW) }}</span>
            </th>
            <th
              v-for="column in columns"
              :key="column.id"
              scope="col"
              :class="[column.headerClass, { 'abp-table-sortable': column.sortable }]"
              :style="column.width ? { width: `${column.width}px` } : undefined"
              :aria-sort="ariaSortOf(column)"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="abp-table-sort"
                @click="toggleSort(column)"
              >
                {{ column.header }}
              </button>
              <template v-else>{{ column.header }}</template>
            </th>
          </tr>
        </thead>

        <tbody class="abp-table-body">
          <template v-for="(row, index) in rows" :key="row.id">
            <tr :class="{ 'abp-table-row-selected': selected.includes(row.id) }">
              <td v-if="selectable" class="abp-table-select">
                <AbpToggle
                  variant="checkbox"
                  :model-value="selected.includes(row.id)"
                  :aria-label="$t(SELECT_ROW)"
                  @update:model-value="toggleSelected(row.id, Boolean($event))"
                />
              </td>
              <td v-if="expandable" class="abp-table-expand">
                <button
                  type="button"
                  class="abp-table-expand-toggle"
                  :aria-expanded="expanded.includes(row.id)"
                  :aria-label="$t(EXPAND_ROW)"
                  @click="toggleExpanded(row.id)"
                >
                  <span aria-hidden="true">{{ expanded.includes(row.id) ? '−' : '+' }}</span>
                </button>
              </td>
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :data-column="cell.column.id"
                :class="columns.find(column => column.id === cell.column.id)?.cellClass"
              >
                <slot
                  :name="`cell-${cell.column.id}`"
                  :row="row.original"
                  :value="cell.getValue()"
                  :index="index"
                >
                  {{ cell.getValue() ?? '' }}
                </slot>
              </td>
            </tr>

            <tr v-if="expandable && expanded.includes(row.id)" class="abp-table-detail">
              <td :colspan="columnCount">
                <slot name="expanded-row" :row="row.original" :index="index" />
              </td>
            </tr>
          </template>

          <tr v-if="!rows.length && !loading" class="abp-table-empty">
            <td :colspan="columnCount">
              <slot name="empty">{{ emptyText ?? $t(EMPTY_TEXT) }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="abp-table-loading">
      <AbpSpinner :label="$t(LOADING)" />
    </div>
  </div>
</template>
