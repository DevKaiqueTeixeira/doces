<template>
  <div class="base-table-shell" :class="{ 'base-table-shell--empty': !loading && rows.length === 0 }">
    <QTable
      v-model:pagination="pagination"
      flat
      bordered
      hide-no-data
      :hide-bottom="loading || rows.length === 0"
      :rows="rows"
      :columns="columns"
      :row-key="rowKey"
      :loading="loading"
      :rows-per-page-options="normalizedRowsPerPageOptions"
      rows-per-page-label="Itens por pagina"
      :pagination-label="formatPaginationLabel"
      class="base-table"
    >
      <template #loading>
        <div class="base-table__state">
          <QSpinner color="primary" size="42px" />
          <span>{{ loadingText }}</span>
        </div>
      </template>

      <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </QTable>

    <div v-if="!loading && rows.length === 0" class="base-table__empty-overlay">
      <div class="base-table__state">
        <QIcon :name="emptyIcon" color="primary" size="42px" />
        <span>{{ emptyText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { QIcon, QSpinner, QTable, type QTableColumn } from 'quasar'

type TablePagination = {
  sortBy: string | null
  descending: boolean
  page: number
  rowsPerPage: number
}

const props = withDefaults(
  defineProps<{
    rows: unknown[]
    columns: QTableColumn[]
    rowKey?: string
    loading?: boolean
    loadingText?: string
    emptyText?: string
    emptyIcon?: string
    initialRowsPerPage?: number
    rowsPerPageOptions?: number[]
  }>(),
  {
    rowKey: 'id',
    loading: false,
    loadingText: 'Carregando dados...',
    emptyText: 'Nenhum item cadastrado ainda.',
    emptyIcon: 'inventory_2',
    initialRowsPerPage: 10,
    rowsPerPageOptions: () => [5, 10, 20, 50],
  },
)

const pagination = ref<TablePagination>({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: props.initialRowsPerPage,
})

const normalizedRowsPerPageOptions = computed(() => {
  return [...new Set([props.initialRowsPerPage, ...props.rowsPerPageOptions])].sort((left, right) => left - right)
})

watch(
  () => props.initialRowsPerPage,
  (rowsPerPage) => {
    pagination.value = {
      ...pagination.value,
      page: 1,
      rowsPerPage,
    }
  },
)

watch(
  [() => props.rows.length, () => pagination.value.rowsPerPage],
  ([rowCount, rowsPerPage]) => {
    if (rowsPerPage === 0) {
      pagination.value = {
        ...pagination.value,
        page: 1,
      }
      return
    }

    const maxPage = Math.max(1, Math.ceil(rowCount / rowsPerPage))

    if (pagination.value.page > maxPage) {
      pagination.value = {
        ...pagination.value,
        page: maxPage,
      }
    }
  },
)

function formatPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) {
  return `${firstRowIndex}-${endRowIndex} de ${totalRowsNumber}`
}
</script>

<style scoped>
.base-table-shell {
  position: relative;
}

.base-table-shell--empty {
  min-height: 240px;
}

.base-table {
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--app-border, rgba(124, 58, 237, 0.12));
  background: rgba(255, 255, 255, 0.84);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  font-family: var(--app-font-sans, Inter, system-ui, sans-serif);
}

.base-table__empty-overlay {
  position: absolute;
  inset: 46px 0 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--app-border, rgba(124, 58, 237, 0.12));
}

.base-table__state {
  min-height: 240px;
  display: grid;
  place-items: center;
  gap: 8px;
  color: var(--app-text-soft, #6d6580);
  text-align: center;
  padding: 20px;
}

.base-table:deep(.q-table thead th) {
  color: var(--app-text-muted, #968daa);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: rgba(124, 58, 237, 0.04);
  border-bottom: 1px solid rgba(124, 58, 237, 0.08);
}

.base-table:deep(.q-table tbody td) {
  color: var(--app-text, #271d39);
  font-size: 0.93rem;
  font-weight: 600;
  border-color: rgba(124, 58, 237, 0.06);
  transition: background-color 0.18s ease;
}

.base-table:deep(.q-table tbody tr:nth-child(even)) {
  background: rgba(124, 58, 237, 0.02);
}

.base-table:deep(.q-table tbody tr:hover) {
  background: rgba(124, 58, 237, 0.05);
}

.base-table:deep(.q-table__bottom) {
  flex-wrap: wrap;
  gap: 10px 14px;
  padding: 14px 18px;
  color: var(--app-text-soft, #6d6580);
  border-top: 1px solid rgba(124, 58, 237, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.base-table:deep(.q-table__bottom-item) {
  font-size: 0.84rem;
  font-weight: 600;
}

.base-table:deep(.q-table__bottom .q-btn) {
  color: var(--app-primary, #7c3aed);
}

@media (max-width: 640px) {
  .base-table__empty-overlay {
    inset: 40px 0 0;
  }

  .base-table:deep(.q-table thead th) {
    font-size: 0.68rem;
    letter-spacing: 0.06em;
  }

  .base-table:deep(.q-table tbody td) {
    font-size: 0.86rem;
  }

  .base-table:deep(.q-table__bottom) {
    justify-content: center;
    padding: 12px 14px;
  }

  .base-table:deep(.q-table__bottom-item) {
    font-size: 0.8rem;
  }
}
</style>
