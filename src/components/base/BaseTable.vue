<template>
  <div class="base-table-shell" :class="{ 'base-table-shell--empty': !loading && rows.length === 0 }">
    <QTable
      flat
      bordered
      hide-bottom
      hide-no-data
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
import { QIcon, QSpinner, QTable, type QTableColumn } from 'quasar'

withDefaults(
  defineProps<{
    rows: unknown[]
    columns: QTableColumn[]
    rowKey?: string
    loading?: boolean
    loadingText?: string
    emptyText?: string
    emptyIcon?: string
  }>(),
  {
    rowKey: 'id',
    loading: false,
    loadingText: 'Carregando dados...',
    emptyText: 'Nenhum item cadastrado ainda.',
    emptyIcon: 'inventory_2',
  },
)
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
}
</style>
