<template>
  <QTable
    flat
    bordered
    hide-bottom
    :rows="rows"
    :columns="columns"
    :row-key="rowKey"
    :loading="loading"
    class="base-table"
  >
    <template #loading>
      <div class="base-table__state">
        <QSpinner color="primary" size="42px" />
        <span>{{ loadingText }}</span>
      </div>
    </template>

    <template #no-data>
      <div class="base-table__state">
        <QIcon name="inventory_2" color="primary" size="42px" />
        <span>{{ emptyText }}</span>
      </div>
    </template>

    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps" />
    </template>
  </QTable>
</template>

<script setup lang="ts">
import { QIcon, QSpinner, QTable, type QTableColumn } from 'quasar'

withDefaults(
  defineProps<{
    rows: unknown[]
    columns: QTableColumn[]
    rowKey?: string
    loading?: boolean
    loadingText?: string
    emptyText?: string
  }>(),
  {
    rowKey: 'id',
    loading: false,
    loadingText: 'Carregando dados...',
    emptyText: 'Nenhum item cadastrado ainda.',
  },
)
</script>

<style scoped>
.base-table {
  border-radius: 20px;
  overflow: hidden;
  font-family: var(--login-sans-font, Inter, system-ui, sans-serif);
}

.base-table__state {
  min-height: 240px;
  display: grid;
  place-items: center;
  gap: 14px;
  color: #6b21a8;
  text-align: center;
  padding: 20px;
}

.base-table:deep(.q-table thead th) {
  color: #6b21a8;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #fcf8ff;
}

.base-table:deep(.q-table tbody td) {
  color: #3b0764;
  font-size: 0.94rem;
  font-weight: 600;
}

.base-table:deep(.q-table tbody tr:nth-child(even)) {
  background: rgba(250, 245, 255, 0.82);
}

@media (max-width: 640px) {
  .base-table:deep(.q-table thead th) {
    font-size: 0.68rem;
    letter-spacing: 0.06em;
  }

  .base-table:deep(.q-table tbody td) {
    font-size: 0.86rem;
  }
}
</style>
