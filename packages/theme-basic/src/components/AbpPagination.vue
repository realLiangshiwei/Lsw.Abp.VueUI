<script setup lang="ts">
import type { AbpPaginationEmits, AbpPaginationProps } from '@lsw-abpvue/theme-shared';
import {
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from 'reka-ui';
import { computed } from 'vue';
import { PAGER_SIZE } from '../defaults/texts.js';

const props = withDefaults(defineProps<AbpPaginationProps>(), {
  siblingCount: 1,
  pageSizes: () => [10, 25, 50, 100],
});

const emit = defineEmits<AbpPaginationEmits>();

/** reka-ui counts pages from one; the contract counts from zero, as `ListService` does. */
const oneBased = computed(() => props.page + 1);
</script>

<template>
  <PaginationRoot
    :page="oneBased"
    :items-per-page="pageSize"
    :total="total"
    :sibling-count="siblingCount"
    :show-edges="true"
    :disabled="Boolean(disabled)"
    :aria-label="ariaLabel"
    as="nav"
    class="abp-pagination"
    @update:page="emit('update:page', $event - 1)"
  >
    <div class="d-flex align-items-center gap-3">
      <PaginationList v-slot="{ items }" class="pagination mb-0">
        <PaginationPrev class="page-link" :aria-label="$t('AbpUi::PagerPrevious')">
          <i class="bi bi-chevron-left" aria-hidden="true" />
        </PaginationPrev>

        <template v-for="(item, index) in items">
          <PaginationListItem
            v-if="item.type === 'page'"
            :key="`page-${item.value}`"
            class="page-link"
            :class="item.value === oneBased ? 'active' : null"
            :value="item.value"
          >
            {{ item.value }}
          </PaginationListItem>
          <PaginationEllipsis v-else :key="`gap-${index}`" class="page-link disabled">
            &#8230;
          </PaginationEllipsis>
        </template>

        <PaginationNext class="page-link" :aria-label="$t('AbpUi::PagerNext')">
          <i class="bi bi-chevron-right" aria-hidden="true" />
        </PaginationNext>
      </PaginationList>

      <select
        v-if="showSizeSelector"
        class="form-select form-select-sm w-auto"
        :value="String(pageSize)"
        :disabled="disabled"
        :aria-label="$t(PAGER_SIZE)"
        @change="emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="size in pageSizes" :key="size" :value="String(size)">{{ size }}</option>
      </select>
    </div>
  </PaginationRoot>
</template>
