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
</style>
