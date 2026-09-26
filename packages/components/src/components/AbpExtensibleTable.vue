<script setup lang="ts" generic="R">
/* eslint-disable vue/no-mutating-props -- `list` is not data but the list's own state: `page`, `sortKey` and `maxResultCount` are writable refs by design (design 04 §14), and driving them is what a pager and a sort header are. */
import {
  LocalizationService,
  PermissionService,
  useListPreferences,
  type ListService,
} from '@lsw-abpvue/core';
import { AbpInput, AbpPagination } from '@lsw-abpvue/theme-shared';
import { computed, watch, watchEffect, type Ref } from 'vue';
import { ACTIONS, NO, PAGER_INFO, PAGER_SEARCH, PAGINATION, YES } from '../defaults/texts.js';
import { PropType } from '../enums/prop-type.js';
import type { EntityProp, PropValue } from '../models/entity-props.js';
import { unwrapResolvable, type PropData } from '../models/prop-data.js';
import type { AbpTableColumn } from '../models/table.js';
import { ExtensionsService } from '../services/extensions.service.js';
import { ENTITY_PROP_TYPE_CLASSES, EXTENSIONS_IDENTIFIER } from '../tokens/extensions.token.js';
import { useGetInjected } from '../utils/use-action-list.js';
import AbpDataTable from './AbpDataTable.vue';
import AbpGridActions from './AbpGridActions.vue';
import AbpPropCell from './AbpPropCell.vue';

/** The column the row buttons live in; no prop can be called this. */
const ACTIONS_COLUMN = '__actions';

const props = withDefaults(
  defineProps<{
    data: readonly R[];
    /** The paging, sorting and filtering state; usually `useListService()`. */
    list: ListService;
    recordKey?: string | undefined;
    /** Localization key of the actions column header. */
    actionsText?: string | undefined;
    actionsColumnWidth?: number | undefined;
    /** Localization key naming the table for a screen reader. */
    caption?: string | undefined;
    selectable?: boolean | undefined;
    expandable?: boolean | undefined;
    /**
     * A search box above the table, bound to the list's filter. Only for a backend whose
     * list endpoint takes one; the filter is sent either way, and an endpoint that
     * ignores it would leave the box doing nothing.
     */
    searchable?: boolean | undefined;
    /** Where the hidden columns are remembered; the list's own key when there is none. */
    persistKey?: string | undefined;
  }>(),
  {
    recordKey: undefined,
    actionsText: undefined,
    actionsColumnWidth: undefined,
    caption: undefined,
    persistKey: undefined,
    selectable: false,
    expandable: false,
    searchable: false,
  },
);

const selected = defineModel<string[]>('selected', { default: () => [] });
const expanded = defineModel<string[]>('expanded', { default: () => [] });
/** The names of the props the user hid. Everything else is visible, new columns included. */
const hiddenColumns = defineModel<string[]>('hiddenColumns', { default: () => [] });

defineSlots<
  {
    toolbar?: () => unknown;
    'expanded-row'?: (props: { row: R; index: number }) => unknown;
    empty?: () => unknown;
  } & {
    [name: `cell-${string}`]: (props: { row: R; value: PropValue; index: number }) => unknown;
  }
>();

const { injector, getInjected } = useGetInjected();
const extensions = injector.get(ExtensionsService);
const identifier = injector.get(EXTENSIONS_IDENTIFIER);
const permission = injector.get(PermissionService);
const localization = injector.get(LocalizationService);
const typeClasses = injector.get(ENTITY_PROP_TYPE_CLASSES);

// Assembled once, the way Angular's table does it: the contributors ran in the route
// resolver, before the page was allowed to render.
const propList = extensions.entityProps.get<R>(identifier).props.toArray();
const actionList = extensions.entityActions.get<R>(identifier).actions.toArray();

const preferences = (() => {
  const key = props.persistKey ?? props.list.persistKey;
  if (!key) return undefined;

  const store = useListPreferences(key);
  // The union, not the stored list: a page that hides a column for a reason of its own
  // still hides it after the user has hidden something else.
  hiddenColumns.value = [
    ...new Set([...hiddenColumns.value, ...(store.read().hiddenColumns ?? [])]),
  ];

  return store;
})();

if (preferences) {
  watch(hiddenColumns, hidden => preferences.patch({ hiddenColumns: hidden }));
}

const visibleProps = computed(() =>
  propList.filter(
    prop =>
      (!prop.permission || permission.isGranted(prop.permission)) &&
      prop.columnVisible(getInjected) &&
      !hiddenColumns.value.includes(prop.name),
  ),
);

/** Whether anybody may press anything, which is what decides the column's existence. */
const hasActions = computed(() =>
  actionList.some(action => !action.permission || permission.isGranted(action.permission)),
);

const dataFor = (record: R, index: number): PropData<R> => ({ record, index, getInjected });

interface PreparedCell {
  value: Ref<PropValue>;
  visible: boolean;
}

/**
 * The cells of the current page, resolved once per change of data or columns. Resolving
 * inside the accessor instead would build a new promise on every render of an
 * asynchronous value, and each one would ask for another render.
 */
const prepared = computed<Map<string, PreparedCell>[]>(() =>
  props.data.map((record, index) => {
    const data = dataFor(record, index);
    const cells = new Map<string, PreparedCell>();

    for (const prop of visibleProps.value) {
      cells.set(prop.name, {
        value: unwrapResolvable(prop.valueResolver(data)) as Ref<PropValue>,
        visible: prop.visible(data),
      });
    }

    return cells;
  }),
);

function textOf(prop: EntityProp<R>, value: PropValue): PropValue {
  if (prop.type === PropType.Boolean) return localization.t(value ? YES : NO);

  if (prop.type === PropType.Enum && prop.enumList) {
    return prop.enumList.find(option => option.value === value)?.label ?? value;
  }

  return value;
}

const columns = computed<AbpTableColumn<R>[]>(() => [
  ...(hasActions.value
    ? [
        {
          id: ACTIONS_COLUMN,
          header: localization.t(props.actionsText ?? ACTIONS),
          width: props.actionsColumnWidth ?? 150,
        },
      ]
    : []),
  ...visibleProps.value.map(prop => ({
    id: prop.name,
    header: localization.t(prop.displayName),
    sortable: prop.sortable,
    ...(prop.columnWidth === undefined ? {} : { width: prop.columnWidth }),
    cellClass: [prop.className, typeClasses[prop.type]].filter(Boolean).join(' ') || undefined,
    value: (_record: R, index: number) => {
      const cell = prepared.value[index]?.get(prop.name);
      return cell?.visible === false ? null : textOf(prop, cell?.value.value ?? null);
    },
  })),
]);

const propsByName = computed(() => new Map(visibleProps.value.map(prop => [prop.name, prop])));

// Two columns of one name is a contributor adding what is already there; the table would
// render both and the second would win every lookup by name. Gated on the expression a
// bundler substitutes, so the message -- which names the inspector -- is not in a
// production build either.
if ((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV) {
  watchEffect(() => {
    if (propsByName.value.size === visibleProps.value.length) return;

    console.warn(
      `[abp] Two columns of ${identifier} carry the same name. __abpvue.inspect('${identifier}') says which contributor added the second one.`,
    );
  });
}

function cellProp(name: string): EntityProp<R> | undefined {
  return propsByName.value.get(name);
}

function cellClicked(name: string, record: R, index: number): void {
  cellProp(name)?.action?.(dataFor(record, index));
}

// Sorting from the fifth page should show the first page of the new order, not the
// fifth of it.
watch([() => props.list.sortKey.value, () => props.list.sortOrder.value], () => {
  props.list.page.value = 0;
});

function goToPage(page: number): void {
  props.list.page.value = page;
}

function setPageSize(size: number): void {
  props.list.maxResultCount.value = size;
}

const pageInfo = computed(() => {
  const first = props.list.page.value * props.list.maxResultCount.value;
  const last = Math.min(first + props.data.length, props.list.totalCount.value);

  return localization.t(
    PAGER_INFO,
    props.data.length ? first + 1 : 0,
    last,
    props.list.totalCount.value,
  );
});
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -- see the note in the script block -->
  <div class="abp-extensible-table">
    <AbpInput
      v-if="searchable"
      v-model="list.filter.value"
      type="search"
      class="abp-extensible-table__search"
      :placeholder="$t(PAGER_SEARCH)"
      :aria-label="$t(PAGER_SEARCH)"
    />

    <AbpDataTable
      v-model:sort-key="list.sortKey.value"
      v-model:sort-order="list.sortOrder.value"
      v-model:selected="selected"
      v-model:expanded="expanded"
      :columns="columns"
      :data="data"
      :record-key="recordKey"
      :caption="caption ? $t(caption) : undefined"
      :selectable="selectable"
      :expandable="expandable"
      :loading="list.requestStatus.value === 'loading'"
    >
      <template v-if="$slots.toolbar" #toolbar><slot name="toolbar" /></template>

      <template #[`cell-${ACTIONS_COLUMN}`]="{ row, index }">
        <AbpGridActions :record="row" :index="index" :text="actionsText" />
      </template>

      <template
        v-for="prop in visibleProps"
        :key="prop.name"
        #[`cell-${prop.name}`]="{ row, value, index }"
      >
        <AbpPropCell
          v-if="prop.component"
          :prop="prop"
          :record="row"
          :index="index"
          :value="value as PropValue"
        />
        <button
          v-else-if="prop.action"
          type="button"
          class="abp-table-cell-action"
          @click="cellClicked(prop.name, row, index)"
        >
          <slot :name="`cell-${prop.name}`" :row="row" :value="value as PropValue" :index="index">
            {{ value ?? '' }}
          </slot>
        </button>
        <slot
          v-else
          :name="`cell-${prop.name}`"
          :row="row"
          :value="value as PropValue"
          :index="index"
        >
          {{ value ?? '' }}
        </slot>
      </template>

      <template v-if="$slots['expanded-row']" #expanded-row="{ row, index }">
        <slot name="expanded-row" :row="row" :index="index" />
      </template>

      <template v-if="$slots.empty" #empty><slot name="empty" /></template>
    </AbpDataTable>

    <div v-if="list.totalCount.value > 0" class="abp-extensible-table-footer">
      <p class="abp-table-info">{{ pageInfo }}</p>
      <AbpPagination
        :page="list.page.value"
        :page-size="list.maxResultCount.value"
        :total="list.totalCount.value"
        :aria-label="$t(PAGINATION)"
        show-size-selector
        @update:page="goToPage($event)"
        @update:page-size="setPageSize($event)"
      />
    </div>
  </div>
</template>
